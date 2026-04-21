import Usuario from '../models/usuarios/usuarios.model.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TEL_RE = /^[\d+\-\s()]+$/;

/** Campos permitidos al crear/actualizar usuario (sin PK, codigo, fecha_registro). */
export const ALLOWED_WRITE_FIELDS = [
    'id_tipousuario', 'nombre', 'ap_paterno', 'ap_materno', 'fecha_nacimiento',
    'telefono_personal', 'telefono_contacto', 'email',
    'id_estado', 'id_municipio', 'colonia', 'calle', 'numero_int', 'numero_ext',
    'codigo_postal', 'razon_social', 'rfc',
    'id_genero', 'id_estatus_usuario', 'id_estatus_marital', 'id_categoria_vivienda'
];

export const getModelMaxLengths = () => {
    const attrs = Usuario.rawAttributes || {};
    const maxLengths = {};
    for (const [name, meta] of Object.entries(attrs)) {
        const len = meta.type?.options?.length;
        if (len) maxLengths[name] = len;
    }
    return maxLengths;
};

export const buildPayload = (body, allowedFields = ALLOWED_WRITE_FIELDS) => {
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

export const validateFormats = (payload, maxLengths) => {
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
