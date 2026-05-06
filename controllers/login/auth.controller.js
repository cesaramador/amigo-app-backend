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
import { sequelize } from '../../database/mysql.js';
import { JWT_EXPIRES_IN, JWT_SECRET, NODE_ENV } from '../../config/env.js';
import { generarCodigoAccesoPlain, sendRecoveryCodeEmailAsync, sendVerificationEmail } from '../../helpers/codigo-acceso-email.js';
import {
    ALLOWED_WRITE_FIELDS,
    buildPayload,
    // getModelMaxLengths
} from '../../helpers/usuario-registro-payload.js';

/**
 * Si el navegador llama al API desde otro origen (p. ej. localhost:8081 → amigo.dextrati.cloud),
 * Set-Cookie / clearCookie con SameSite=Lax provoca avisos y el cliente ignora la cookie.
 * En login: no enviamos la cookie auxiliar "valor". En logout: no enviamos clearCookie;
 * la sesión ya se invalidó en el servidor con destroy().
 */
function isSameSiteAsApi(req) {
    const host = String(req.get('host') || '').split(':')[0].toLowerCase();
    const origin = req.get('origin');
    if (!origin || !host) return true;
    try {
        const originHost = new URL(origin).hostname.toLowerCase();
        return originHost === host;
    } catch {
        return true;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/registrar
// Registra un nuevo usuario en el sistema.
// ─────────────────────────────────────────────────────────────────────────────
export const registrar = async (req, res) => {
    try {
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

        const codigoPlain = generarCodigoAccesoPlain();
        const codigoHash = await bcrypt.hash(codigoPlain, 10);

        const data = {
            ...payload,
            codigo: codigoHash,
            fecha_registro: new Date()
        };

        const nuevoUsuario = await sequelize.transaction(async (t) => {
            if (data.email) {
                const existsEmail = await Usuario.findOne({
                    where: { email: data.email },
                    transaction: t
                });
                if (existsEmail) {
                    const err = new Error('El email ya está registrado.');
                    err.statusCode = 409;
                    err.field = 'email';
                    throw err;
                }
            }
            if (data.telefono_personal) {
                const existsTel = await Usuario.findOne({
                    where: { telefono_personal: data.telefono_personal },
                    transaction: t
                });
                if (existsTel) {
                    const err = new Error('El teléfono personal ya está registrado.');
                    err.statusCode = 409;
                    err.field = 'telefono_personal';
                    throw err;
                }
            }
            return await Usuario.create(data, { transaction: t });
        });

        sendVerificationEmail(data.email, data.nombre, codigoPlain);

        const userSafe = nuevoUsuario.get({ plain: true });
        delete userSafe.codigo;

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

        const user = await Usuario.findOne({ where: { telefono_personal } });
        if (!user) {
            // 200 + success:false evita que el navegador marque el XHR como error en consola (401); el mensaje sigue siendo genérico.
            return res.status(200).json({ success: false, message: "Credenciales incorrectas." });
        }

        const codigoValido = await bcrypt.compare(codigo, user.codigo);
        if (!codigoValido) {
            return res.status(200).json({ success: false, message: "Credenciales incorrectas." });
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

        // Cookie auxiliar solo en mismo sitio; cross-origin + SameSite=Lax la rechaza el navegador.
        if (isSameSiteAsApi(req)) {
            res.cookie("valor", "true", {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: "lax",
                maxAge: 300000 * 10 // 1 hora
            });
        }

        // NOTA: Asegurarse de que el middleware express-session esté configurado en app.js
        if (req.session) {
            req.session.amigo = req.sessionID;
            req.session.usuario = user.telefono_personal;
            req.session.id_usuario = user.id_usuario;
            req.session.id_tipousuario = user.id_tipousuario;
        }
        
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

export const recuperarCodigo = async (req, res) => {
    try {
        const telefono_personal = String(req.body.telefono_personal).trim();
        const email = String(req.body.email).trim().toLowerCase();

        const record = await Usuario.findOne({
            where: { telefono_personal, email }
        });

        if (!record) {
            // 200 + success:false evita que el navegador marque el XHR como error en consola (400).
            return res.status(200).json({
                success: false,
                message:
                    "El número celular y el correo no coinciden con una misma cuenta registrada. Revise ambos datos."
            });
        }

        if (Number(record.id_estatus_usuario) !== ID_ESTATUS_USUARIO_ACTIVO) {
            return res.status(403).json({
                success: false,
                message:
                    "No puede recuperar el código: en el sistema el estatus de su usuario debe ser \"activo\". Consulte al INAPAM si cree que es un error."
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

export const abandonar = async (req, res) => {
    try {
        const clearBrowserCookies = isSameSiteAsApi(req);
        const cookieOpts = { httpOnly: true, secure: NODE_ENV === 'production', sameSite: "lax" };

        if (clearBrowserCookies) {
            res.clearCookie("valor", cookieOpts);
        }

        // Destruir la sesión
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error al destruir sesión:", err);
                    return res.status(500).json({ success: false, message: "No se pudo cerrar la sesión correctamente." });
                }
                if (clearBrowserCookies) {
                    res.clearCookie("amigo", cookieOpts);
                    res.clearCookie("connect.sid", cookieOpts);
                }
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
