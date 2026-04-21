import Usuario from '../models/usuarios/usuarios.model.js';
import {
    ALLOWED_WRITE_FIELDS,
    buildPayload,
    getModelMaxLengths,
    validateFormats
} from '../helpers/usuario-registro-payload.js';

/**
 * Seguridad + validación para registro público:
 * - Rechaza claves no permitidas en el JSON raíz.
 * - Solo conserva campos de ALLOWED_WRITE_FIELDS.
 * - Mismas reglas de obligatoriedad y formato que POST /usuarios (usuarioPost).
 */
export const validarRegistroPublico = (req, res, next) => {
    try {
        const raw = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
        const rawKeys = Object.keys(raw);
        const unknown = rawKeys.filter((k) => !ALLOWED_WRITE_FIELDS.includes(k));
        if (unknown.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Se enviaron campos no permitidos en el registro.',
                fields: unknown.map((field) => ({ field, reason: 'Campo no permitido en registro público.' }))
            });
        }

        let payload;
        try {
            payload = buildPayload(raw, ALLOWED_WRITE_FIELDS);
        } catch (e) {
            const code = e.statusCode || 400;
            return res.status(code).json({ success: false, message: e.message || 'Solicitud inválida.' });
        }

        if (payload.email !== undefined && payload.email !== null) {
            payload.email = String(payload.email).trim().toLowerCase();
        }

        const attrs = Usuario.rawAttributes || {};
        const requiredFields = Object.keys(attrs).filter((name) => {
            const m = attrs[name];
            return (
                m.allowNull === false
                && !m.primaryKey
                && m.defaultValue === undefined
                && name !== 'codigo'
                && name !== 'fecha_registro'
            );
        });
        const missing = requiredFields.filter((f) => {
            const v = payload[f];
            return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
        });
        if (missing.length) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios.',
                fields: missing
            });
        }

        const maxLengths = getModelMaxLengths();
        const formatErrors = validateFormats(payload, maxLengths);
        if (formatErrors.length) {
            return res.status(400).json({
                success: false,
                message: 'Errores de formato en los datos.',
                fields: formatErrors
            });
        }

        req.registroPublicoPayload = payload;
        return next();
    } catch (err) {
        console.error('validarRegistroPublico:', err);
        return res.status(500).json({ success: false, message: 'Error al validar el registro.' });
    }
};
