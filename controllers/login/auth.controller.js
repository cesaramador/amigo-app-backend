import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Usuario from '../../models/usuarios/usuarios.model.js';
import TiposUsuarios from '../../models/usuarios/tiposusuarios.model.js';
import Matrizacceso from '../../models/matriz/matrizacceso.model.js';
import Estados from "../../models/usuarios/estados.model.js";
import Municipios from "../../models/usuarios/municipios.model.js";
import Generos from "../../models/usuarios/generos.model.js";
import EstatusUsuarios from "../../models/usuarios/estatususuarios.model.js";
import EstatusMaritales from "../../models/usuarios/estatusmaritales.model.js";
import CategoriasViviendas from "../../models/usuarios/categoriasviviendas.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET, NODE_ENV } from '../../config/env.js';
import { generarCodigoAccesoPlain, sendRecoveryCodeEmailAsync } from '../../helpers/codigo-acceso-email.js';
import {
    ALLOWED_WRITE_FIELDS,
    buildPayload,
    getModelMaxLengths,
    validateFormats
} from '../../helpers/usuario-registro-payload.js';
import { persistirNuevoUsuarioConCodigo } from '../../services/usuario-alta.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/registrar
// Registra un nuevo usuario en el sistema.
// ─────────────────────────────────────────────────────────────────────────────
export const registrar = async (req, res) => {
    try {
        const maxLengths = getModelMaxLengths();
        let payload;
        try {
            payload = buildPayload(req.body, ALLOWED_WRITE_FIELDS);
        } catch (e) {
            const code = e.statusCode || 400;
            return res.status(code).json({ success: false, message: e.message || 'Solicitud inválida.' });
        }

        if (payload.email !== undefined && payload.email !== null) {
            payload.email = String(payload.email).trim().toLowerCase();
        }

        const attrs = Usuario.rawAttributes || {};
        const requiredFields = Object.keys(attrs).filter(name => {
            const m = attrs[name];
            return m.allowNull === false && !m.primaryKey && m.defaultValue === undefined && name !== 'codigo' && name !== 'fecha_registro';
        });
        const missing = requiredFields.filter(f => {
            const v = payload[f];
            return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
        });
        if (missing.length) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.', fields: missing });
        }

        const formatErrors = validateFormats(payload, maxLengths);
        if (formatErrors.length) {
            return res.status(400).json({ success: false, message: 'Errores de formato en los datos.', fields: formatErrors });
        }

        const { userSafe } = await persistirNuevoUsuarioConCodigo(payload);

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Se ha enviado un código de verificación por email.',
            data: { user: userSafe }
        });

    } catch (error) {
        if (error.statusCode === 409 || error.statusCode === 400) {
            return res.status(error.statusCode).json({ success: false, message: error.message, field: error.field });
        }
        console.error("Error en registrarUsuario:", error);
        return res.status(500).json({ success: false, message: "Error interno en registro." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/iniciar
// Endpoint de inicio de sesión (Login)
// ─────────────────────────────────────────────────────────────────────────────
export const iniciar = async (req, res) => {
    try {
        const { telefono_personal, codigo } = req.body;

        if (!telefono_personal || !codigo) {
            return res.status(400).json({ success: false, message: "El teléfono y el código son obligatorios." });
        }

        const user = await Usuario.findOne({ where: { telefono_personal } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Credenciales incorrectas." }); // Uso 401 para ocultar si existe
        }

        const codigoValido = await bcrypt.compare(codigo, user.codigo);
        if (!codigoValido) {
            return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
        }

        // const token_init = { id: user.telefono_personal };
        const sessionId = req.sessionID;
        const payload = {
            id_usuario: user.id_usuario,
            id_tipousuario: user.id_tipousuario,
            telefono_personal: user.telefono_personal,
            sessionId: sessionId
        };

        // const token = jwt.sign(token_init, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Remover campos sensibles
        const userSafe = user.get({ plain: true });
        delete userSafe.codigo;

        // Establecer cookies y sesión
        res.cookie("valor", "true", {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: "lax",
            maxAge: 300000 * 10 // 1 hora
        });

        // NOTA: Asegurarse de que el middleware express-session esté configurado en app.js
        if (req.session) {
            // req.session.amigo = req.sessionID;
            // req.session.usuario = user.telefono_personal;
            req.session.amigo = req.sessionID;
            req.session.usuario = user.telefono_personal;
            req.session.id_usuario = user.id_usuario;
            req.session.id_tipousuario = user.id_tipousuario;
        }
        
        // const idSession = req.session?.amigo || 'No session set';
        // const userSession = req.session?.usuario || 'No session set';

        // Obtener matriz de acceso
        let matrizacceso = [];
        try {
            matrizacceso = await Matrizacceso.findAll({ where: { id_tipousuario: user.id_tipousuario } });
        } catch (mErr) {
            console.warn("No se pudo obtener la matriz de acceso:", mErr.message);
            // No bloqueamos el login pero la matriz irá vacía
        }

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso.",
            data: {
                // token,
                // idSession,
                // userSession,
                // matrizacceso,
                // user: userSafe
                token,
                idSession: req.sessionID,
                userSession: user.telefono_personal,
                matrizacceso,
                user: userSafe
            }
        });

    } catch (error) {
        console.error("Error en iniciar sesión:", error);
        return res.status(500).json({ success: false, message: "Error interno en el inicio de sesión." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/recuperar-codigo
// Recupera y regenera código de acceso por teléfono + email
// ─────────────────────────────────────────────────────────────────────────────
const ID_ESTATUS_USUARIO_ACTIVO = 1;
const TEXTO_ESTATUS_USUARIO_ACTIVO = "activo";

export const recuperarCodigo = async (req, res) => {
    try {
        const telefono_personal = String(req.body.telefono_personal).trim();
        const email = String(req.body.email).trim().toLowerCase();

        const record = await Usuario.findOne({
            where: { telefono_personal, email }
        });

        if (!record) {
            return res.status(400).json({
                success: false,
                message:
                    "El número celular y el correo no coinciden con una misma cuenta registrada. Revise ambos datos."
            });
        }

        if (Number(record.id_estatus_usuario) !== ID_ESTATUS_USUARIO_ACTIVO) {
            return res.status(403).json({
                success: false,
                message:
                    "No puede recuperar el código: su cuenta debe tener estatus de usuario activo (identificador 1). Su cuenta no cumple ese requisito."
            });
        }

        const estatusRow = await EstatusUsuarios.findByPk(record.id_estatus_usuario);
        const textoEstatus =
            estatusRow?.estatus_usuario != null
                ? String(estatusRow.estatus_usuario).trim().toLowerCase()
                : "";

        if (!estatusRow || textoEstatus !== TEXTO_ESTATUS_USUARIO_ACTIVO) {
            return res.status(403).json({
                success: false,
                message:
                    "No puede recuperar el código: en el sistema el estatus de su usuario debe ser \"activo\" y el identificador 1. Consulte a un administrador si cree que es un error."
            });
        }

        const codigoPlain = generarCodigoAccesoPlain();
        const codigoHash = await bcrypt.hash(codigoPlain, 10);
        const codigoAnterior = record.codigo;

        await record.update({ codigo: codigoHash });

        try {
            await sendRecoveryCodeEmailAsync(record.email, record.nombre, codigoPlain);
        } catch (mailErr) {
            console.error("Error enviando correo de recuperación:", mailErr);
            await record.update({ codigo: codigoAnterior });
            return res.status(503).json({
                success: false,
                message:
                    "No fue posible enviar el correo en este momento. Intente de nuevo más tarde. Si el problema continúa, contacte al administrador."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Se generó un nuevo código de acceso y se envió a su correo electrónico."
        });
    } catch (error) {
        console.error("Error en recuperarCodigo:", error);
        return res.status(500).json({ success: false, message: "Error interno al recuperar el código de acceso." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/abandonar
// Endpoint de cierre de sesión (Logout)
// ─────────────────────────────────────────────────────────────────────────────
// export const abandonar = async (req, res) => {
//     try {
//         res.clearCookie("valor", { httpOnly: true, secure: false, sameSite: "lax" });

//         // Destruir la sesión
//         if (req.session) {
//             req.session.destroy((err) => {
//                 if (err) {
//                     console.error("Error al destruir sesión:", err);
//                     return res.status(500).json({ success: false, message: "No se pudo cerrar la sesión correctamente." });
//                 }
//                 // Limpiar cookie de sesión (connect.sid)
//                 res.clearCookie("connect.sid", { httpOnly: true, secure: false, sameSite: "lax" });
//                 return res.status(200).json({ success: true, message: "Sesión cerrada correctamente." });
//             });
//         } else {
//             // Si no había sesión, igual respondemos ok
//             return res.status(200).json({ success: true, message: "No había sesión activa, pero el cierre se procesó." });
//         }

//     } catch (error) {
//         console.error("Error en abandonar():", error);
//         return res.status(500).json({ success: false, message: "Error interno al cerrar sesión." });
//     }
// };

export const abandonar = async (req, res) => {
    try {
        // Limpiar cookie auxiliar
        res.clearCookie("valor", { httpOnly: true, secure: NODE_ENV === 'production', sameSite: "lax" });

        // Destruir la sesión
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error al destruir sesión:", err);
                    return res.status(500).json({ success: false, message: "No se pudo cerrar la sesión correctamente." });
                }
                // Limpiar cookie de sesión real configurada en app.js (name: 'amigo')
                res.clearCookie("amigo", { httpOnly: true, secure: NODE_ENV === 'production', sameSite: "lax" });
                // Compatibilidad por si existiera cookie por defecto en entornos previos.
                res.clearCookie("connect.sid", { httpOnly: true, secure: NODE_ENV === 'production', sameSite: "lax" });
                return res.status(200).json({ success: true, message: "Sesión cerrada correctamente." });
            });
        } else {
            // Si no había sesión, igual respondemos ok
            return res.status(200).json({ success: true, message: "No había sesión activa." });
        }
    } catch (error) {
        console.error("Error en abandonar():", error);
        return res.status(500).json({ success: false, message: "Error interno al cerrar sesión." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/municipios/:id_estado
// Utilidad para formularios (no requiere token por diseño)
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerMunicipiosPorEstado = async (req, res) => {
    try {
        const id_estado = Number(req.params.id_estado);

        if (!Number.isInteger(id_estado) || id_estado <= 0) {
            return res.status(400).json({ success: false, message: "Debe proporcionar un id_estado válido." });
        }

        // Operación de lectura simple, sin necesidad de transacción.
        const municipios = await Municipios.findAll({
            where: { id_estado },
            attributes: ["num_municipio", "municipio"]
        });

        return res.status(200).json({
            success: true,
            message: "Municipios encontrados",
            total_registros: municipios.length,
            data: municipios
        });

    } catch (error) {
        console.error("Error al obtener municipios:", error.message || error);
        return res.status(500).json({ success: false, message: "Error interno al consultar municipios." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/tipos-usuarios
// Catálogo público de tipos de usuario para registro
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerTiposUsuariosPublicos = async (_req, res) => {
    try {
        const tipos = await TiposUsuarios.findAll({
            attributes: ["id_tipousuario", "tipo_usuario"],
            order: [["id_tipousuario", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            message: "Tipos de usuario encontrados",
            total_registros: tipos.length,
            data: tipos
        });
    } catch (error) {
        console.error("Error al obtener tipos de usuario:", error.message || error);
        return res.status(500).json({
            success: false,
            message: "Error interno al consultar tipos de usuario."
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/estados
// Catálogo público de estados para registro
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerEstadosPublicos = async (_req, res) => {
    try {
        const estados = await Estados.findAll({
            attributes: ["id_estado", "estado"],
            order: [["estado", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            message: "Estados encontrados",
            total_registros: estados.length,
            data: estados
        });
    } catch (error) {
        console.error("Error al obtener estados:", error.message || error);
        return res.status(500).json({ success: false, message: "Error interno al consultar estados." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/generos
// Catálogo público de géneros para registro
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerGenerosPublicos = async (_req, res) => {
    try {
        const generos = await Generos.findAll({
            attributes: ["id_genero", "genero"],
            order: [["id_genero", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            message: "Géneros encontrados",
            total_registros: generos.length,
            data: generos
        });
    } catch (error) {
        console.error("Error al obtener géneros:", error.message || error);
        return res.status(500).json({ success: false, message: "Error interno al consultar géneros." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/estatus-usuarios
// Catálogo público de estatus de usuario para registro
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerEstatusUsuariosPublicos = async (_req, res) => {
    try {
        const estatus = await EstatusUsuarios.findAll({
            attributes: ["id_estatususuario", "estatus_usuario"],
            order: [["id_estatususuario", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            message: "Estatus de usuario encontrados",
            total_registros: estatus.length,
            data: estatus
        });
    } catch (error) {
        console.error("Error al obtener estatus de usuario:", error.message || error);
        return res.status(500).json({ success: false, message: "Error interno al consultar estatus de usuario." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/estatus-maritales
// Catálogo público de estatus marital para registro
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerEstatusMaritalesPublicos = async (_req, res) => {
    try {
        const estatus = await EstatusMaritales.findAll({
            attributes: ["id_estatusmarital", "estatus_marital"],
            order: [["id_estatusmarital", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            message: "Estatus maritales encontrados",
            total_registros: estatus.length,
            data: estatus
        });
    } catch (error) {
        console.error("Error al obtener estatus maritales:", error.message || error);
        return res.status(500).json({ success: false, message: "Error interno al consultar estatus maritales." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/categorias-viviendas
// Catálogo público de categorías de vivienda para registro
// ─────────────────────────────────────────────────────────────────────────────
export const obtenerCategoriasViviendasPublicas = async (_req, res) => {
    try {
        const categorias = await CategoriasViviendas.findAll({
            attributes: ["id_categoriavivienda", "categoria_vivienda"],
            order: [["id_categoriavivienda", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            message: "Categorías de vivienda encontradas",
            total_registros: categorias.length,
            data: categorias
        });
    } catch (error) {
        console.error("Error al obtener categorías de vivienda:", error.message || error);
        return res.status(500).json({ success: false, message: "Error interno al consultar categorías de vivienda." });
    }
};
