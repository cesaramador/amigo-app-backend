import Usuario from "../../models/usuarios/usuarios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';
import { SMTP_HOST, SMTP_USER, SMTP_PASS } from '../../config/env.js';
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Extraer longitudes máximas desde rawAttributes del modelo
const getModelMaxLengths = () => {
    const attrs = Usuario.rawAttributes || {};
    const maxLengths = {};
    for (const [name, meta] of Object.entries(attrs)) {
        const len = meta.type?.options?.length;
        if (len) maxLengths[name] = len;
    }
    return maxLengths;
};

// Regex de validación
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE   = /^[\d+\-\s()]+$/;

// Campos de la lista blanca para escritura (excluye PK y fecha_registro)
const ALLOWED_WRITE_FIELDS = [
    'id_tipousuario', 'nombre', 'ap_paterno', 'ap_materno', 'fecha_nacimiento',
    'telefono_personal', 'telefono_contacto', 'email',
    'id_estado', 'id_municipio', 'colonia', 'calle', 'numero_int', 'numero_ext',
    'codigo_postal', 'razon_social', 'rfc',
    'id_genero', 'id_estatus_usuario', 'id_estatus_marital', 'id_categoria_vivienda'
];

// Construir payload seguro desde req.body, solo campos en whitelist
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

// Validar formato de email y teléfono
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

// Enviar correo con código de verificación (fire-and-forget, no bloquea la respuesta)
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
// GET /api/v1/usuarios
// Obtener todos los usuarios (con paginación, búsqueda, filtros y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosGet = async (req, res, next) => {
    try {
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Filtros por FK enteras
        const filters = {};
        ['id_genero', 'id_estatus_usuario', 'id_tipousuario', 'id_estado', 'id_municipio'].forEach(key => {
            if (req.query[key] !== undefined) {
                const v = Number(req.query[key]);
                if (!Number.isNaN(v) && v > 0) filters[key] = v;
            }
        });

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = { ...filters };
        if (q) {
            where[Op.or] = [
                { nombre:            { [Op.like]: `%${q}%` } },
                { ap_paterno:        { [Op.like]: `%${q}%` } },
                { ap_materno:        { [Op.like]: `%${q}%` } },
                { email:             { [Op.like]: `%${q}%` } },
                { telefono_personal: { [Op.like]: `%${q}%` } }
            ];
        }

        // Orden seguro
        const allowedSortFields = ['id_usuario', 'nombre', 'fecha_registro', 'id_tipousuario', 'ap_paterno'];
        const [sortField = 'id_usuario', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_usuario:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_usuario';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await Usuario.findAndCountAll({
            where,
            attributes: { exclude: ['codigo'] },   // nunca exponer el hash
            limit,
            offset,
            order: [[sortFieldSafe, sortOrder]]
        });

        const total = result.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en usuariosGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/usuarios/:id
// Obtener un usuario por ID (sin exponer codigo)
// ─────────────────────────────────────────────────────────────────────────────
export const usuarioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['codigo'] }
        });

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.status(200).json({ success: true, data: usuario });
    } catch (error) {
        console.error('Error en usuarioGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/usuarios
// Registrar un nuevo usuario
// ─────────────────────────────────────────────────────────────────────────────
export const usuarioPost = async (req, res, next) => {
    try {
        const maxLengths = getModelMaxLengths();

        // Construir payload con lista blanca
        const payload = buildPayload(req.body, ALLOWED_WRITE_FIELDS);

        // Validar campos obligatorios según modelo (allowNull: false sin defaultValue ni PK)
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

        // Validar formatos y longitudes
        const formatErrors = validateFormats(payload, maxLengths);
        if (formatErrors.length) {
            return res.status(400).json({ success: false, message: 'Errores de formato en los datos.', fields: formatErrors });
        }

        // Generar código de 5 dígitos y hashearlo ANTES de la transacción
        const codigoPlain = Math.floor(10000 + Math.random() * 90000).toString();
        const codigoHash  = await bcrypt.hash(codigoPlain, 10);

        // Asignar fecha de registro y código hasheado
        payload.codigo         = codigoHash;
        payload.fecha_registro = new Date();

        // Verificación de unicidad + creación en una sola transacción atómica
        const nuevousuario = await sequelize.transaction(async (t) => {
            // Verificar unicidad de email
            if (payload.email) {
                const existsEmail = await Usuario.findOne({
                    where: { email: payload.email },
                    transaction: t
                });
                if (existsEmail) {
                    const err = new Error('El email ya está registrado.');
                    err.statusCode = 409;
                    err.field = 'email';
                    throw err;
                }
            }
            // Verificar unicidad de telefono_personal
            if (payload.telefono_personal) {
                const existsTel = await Usuario.findOne({
                    where: { telefono_personal: payload.telefono_personal },
                    transaction: t
                });
                if (existsTel) {
                    const err = new Error('El teléfono personal ya está registrado.');
                    err.statusCode = 409;
                    err.field = 'telefono_personal';
                    throw err;
                }
            }

            return await Usuario.create(payload, { transaction: t });
        });

        // Preparar respuesta segura (sin exponer codigo/hash)
        const userSafe = nuevousuario.get({ plain: true });
        delete userSafe.codigo;

        // Enviar correo con código en texto plano (fire-and-forget)
        sendVerificationEmail(payload.email, payload.nombre, codigoPlain);

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Se ha enviado un código de verificación por email.',
            data: { user: userSafe }
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message, field: error.field });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Error en usuarioPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/usuarios/:id
// Reemplazar completamente un usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const usuarioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const maxLengths = getModelMaxLengths();
        const payload = buildPayload(req.body, ALLOWED_WRITE_FIELDS);

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar.' });
        }

        // Si se actualiza el codigo, hashearlo antes de guardar
        if (payload.codigo) {
            payload.codigo = await bcrypt.hash(String(payload.codigo), 10);
        }

        // Validar formatos y longitudes
        const formatErrors = validateFormats(payload, maxLengths);
        if (formatErrors.length) {
            return res.status(400).json({ success: false, message: 'Errores de formato en los datos.', fields: formatErrors });
        }

        // Verificar unicidad + actualización en una sola transacción
        const result = await sequelize.transaction(async (t) => {
            const record = await Usuario.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar unicidad de email (excluir el propio registro)
            if (payload.email) {
                const exists = await Usuario.findOne({
                    where: { email: payload.email, id_usuario: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El email ya está registrado por otro usuario.');
                    err.statusCode = 409;
                    err.field = 'email';
                    throw err;
                }
            }
            // Verificar unicidad de telefono_personal (excluir el propio registro)
            if (payload.telefono_personal) {
                const exists = await Usuario.findOne({
                    where: { telefono_personal: payload.telefono_personal, id_usuario: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El teléfono personal ya está registrado por otro usuario.');
                    err.statusCode = 409;
                    err.field = 'telefono_personal';
                    throw err;
                }
            }

            await record.update(payload, { transaction: t });
            return record;
        });

        if (result === null) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // Respuesta segura sin codigo
        const userSafe = result.get({ plain: true });
        delete userSafe.codigo;

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente.',
            data: userSafe
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message, field: error.field });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Error en usuarioPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/usuarios/:id
// Actualizar parcialmente un usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const usuarioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const maxLengths = getModelMaxLengths();
        const payload = buildPayload(req.body, ALLOWED_WRITE_FIELDS);

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar.' });
        }

        // Si se actualiza el codigo, hashearlo antes de guardar
        if (payload.codigo) {
            payload.codigo = await bcrypt.hash(String(payload.codigo), 10);
        }

        // Validar formatos y longitudes
        const formatErrors = validateFormats(payload, maxLengths);
        if (formatErrors.length) {
            return res.status(400).json({ success: false, message: 'Errores de formato en los datos.', fields: formatErrors });
        }

        // Verificar unicidad + actualización en una sola transacción
        const result = await sequelize.transaction(async (t) => {
            const record = await Usuario.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar unicidad de email (excluir el propio registro)
            if (payload.email) {
                const exists = await Usuario.findOne({
                    where: { email: payload.email, id_usuario: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El email ya está registrado por otro usuario.');
                    err.statusCode = 409;
                    err.field = 'email';
                    throw err;
                }
            }
            // Verificar unicidad de telefono_personal (excluir el propio registro)
            if (payload.telefono_personal) {
                const exists = await Usuario.findOne({
                    where: { telefono_personal: payload.telefono_personal, id_usuario: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El teléfono personal ya está registrado por otro usuario.');
                    err.statusCode = 409;
                    err.field = 'telefono_personal';
                    throw err;
                }
            }

            await record.update(payload, { transaction: t });
            return record;
        });

        if (result === null) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // Respuesta segura sin codigo
        const userSafe = result.get({ plain: true });
        delete userSafe.codigo;

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado parcialmente.',
            data: userSafe
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message, field: error.field });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Error en usuarioPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/usuarios/:id
// Eliminar un usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const usuarioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Usuario.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            delete snapshot.codigo;   // nunca exponer el hash en la respuesta
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario eliminado correctamente.',
            data: deleted
        });
    } catch (error) {
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el usuario: está referenciado en otros registros.'
            });
        }
        console.error('Error en usuarioDelete:', error.message || error);
        return next(error);
    }
};
