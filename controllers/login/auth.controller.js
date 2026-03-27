import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import Usuario from '../../models/usuarios/usuarios.model.js';
import Matrizacceso from '../../models/matriz/matrizacceso.model.js';
import Municipios from "../../models/usuarios/municipios.model.js";
import { sequelize } from '../../database/mysql.js';
import { JWT_EXPIRES_IN, JWT_SECRET, SMTP_HOST, SMTP_USER, SMTP_PASS, NODE_ENV } from '../../config/env.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE   = /^[\d+\-\s()]+$/;

const ALLOWED_WRITE_FIELDS = [
    'id_tipousuario', 'nombre', 'ap_paterno', 'ap_materno', 'fecha_nacimiento',
    'telefono_personal', 'telefono_contacto', 'email',
    'id_estado', 'id_municipio', 'colonia', 'calle', 'numero_int', 'numero_ext',
    'codigo_postal', 'razon_social', 'rfc',
    'id_genero', 'id_estatus_usuario', 'id_estatus_marital', 'id_categoria_vivienda'
];

const getModelMaxLengths = () => {
    const attrs = Usuario.rawAttributes || {};
    const maxLengths = {};
    for (const [name, meta] of Object.entries(attrs)) {
        const len = meta.type?.options?.length;
        if (len) maxLengths[name] = len;
    }
    return maxLengths;
};

const buildPayload = (body, allowedFields) => {
    const payload = {};
    for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
            const val = body[key];
            if (val !== null && typeof val === 'object') {
                throw Object.assign(new TypeError(`Campo malformado: ${key}`), { statusCode: 400 });
            }
            payload[key] = val;
        }
    }
    return payload;
};

const validateFormats = (payload, maxLengths) => {
    const errors = [];
    if (payload.email !== undefined) {
        if (!payload.email || !EMAIL_RE.test(String(payload.email))) {
            errors.push({ field: 'email', reason: 'Formato de email inválido.' });
        }
    }
    if (payload.telefono_personal !== undefined) {
        const tel = String(payload.telefono_personal || '');
        const maxTel = maxLengths.telefono_personal ?? 10;
        if (!TEL_RE.test(tel) || tel.length > maxTel) {
            errors.push({ field: 'telefono_personal', reason: `Formato inválido o excede ${maxTel} caracteres.` });
        }
    }
    if (payload.telefono_contacto !== undefined && payload.telefono_contacto) {
        const tel = String(payload.telefono_contacto);
        const maxTel = maxLengths.telefono_contacto ?? 10;
        if (!TEL_RE.test(tel) || tel.length > maxTel) {
            errors.push({ field: 'telefono_contacto', reason: `Formato inválido o excede ${maxTel} caracteres.` });
        }
    }
    // Validar longitudes de campos STRING
    for (const [field, maxLen] of Object.entries(maxLengths)) {
        if (payload[field] !== undefined && payload[field] !== null) {
            const str = String(payload[field]);
            if (str.length > maxLen) {
                errors.push({ field, reason: `No puede exceder ${maxLen} caracteres.` });
            }
        }
    }
    return errors;
};

const sendVerificationEmail = (toEmail, nombre, codigoPlain) => {
    (async () => {
        try {
            const transporter = nodemailer.createTransport({
                service: SMTP_HOST,
                auth: { user: SMTP_USER, pass: SMTP_PASS }
            });
            await transporter.sendMail({
                from: SMTP_USER,
                to: toEmail,
                subject: 'Código de acceso inicial App Amigo',
                html: `
                    <p>Hola ${nombre},</p>
                    <p>Tu código para tu acceso es:</p>
                    <h2>${codigoPlain}</h2>
                    <p>Este código solo será necesario en tu primer inicio de sesión.</p>
                `
            });
        } catch (e) {
            console.warn('No se pudo enviar el correo de verificación:', e.message);
        }
    })();
};


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/registrar
// Registra un nuevo usuario en el sistema.
// ─────────────────────────────────────────────────────────────────────────────
export const registrar = async (req, res) => {
    try {
        const maxLengths = getModelMaxLengths();
        const payload = buildPayload(req.body, ALLOWED_WRITE_FIELDS);

        // Validar campos obligatorios
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

        // Validar formatos
        const formatErrors = validateFormats(payload, maxLengths);
        if (formatErrors.length) {
            return res.status(400).json({ success: false, message: 'Errores de formato en los datos.', fields: formatErrors });
        }

        // Generar código de 5 dígitos y hashearlo
        //const codigoPlain = Math.floor(10000 + Math.random() * 90000).toString();
        
        // Generar código de 6 dígitos y hashearlo
        const codigoPlain = Math.floor(100000 + Math.random() * 900000).toString();
        const codigoHash = await bcrypt.hash(codigoPlain, 10);

        payload.codigo = codigoHash;
        payload.fecha_registro = new Date();

        // Guardar con verificación atómica de duplicados
        const nuevousuario = await sequelize.transaction(async (t) => {
            if (payload.email) {
                const e = await Usuario.findOne({ where: { email: payload.email }, transaction: t });
                if (e) { const err = new Error('El email ya está registrado.'); err.statusCode = 409; throw err; }
            }
            if (payload.telefono_personal) {
                const tel = await Usuario.findOne({ where: { telefono_personal: payload.telefono_personal }, transaction: t });
                if (tel) { const err = new Error('El teléfono personal ya está registrado.'); err.statusCode = 409; throw err; }
            }
            return await Usuario.create(payload, { transaction: t });
        });

        // ⚠️ IMPORTANTE: Nunca devolver el token en el registro si el flujo exige validar el código primero,
        // ni tampoco el código (hash/plain) por seguridad.
        const userSafe = nuevousuario.get({ plain: true });
        delete userSafe.codigo;

        sendVerificationEmail(payload.email, payload.nombre, codigoPlain);

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Se ha enviado un código de verificación por email.',
            data: {
                user: userSafe
            }
            // NOTA: Se ha eliminado expresamente la exposición del código y del token en la respuesta.
        });

    } catch (error) {
        if (error.statusCode === 409 || error.statusCode === 400) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
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
            secure: false, // -> true en producción con TLS
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
                // Limpiar cookie de sesión (connect.sid)
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
