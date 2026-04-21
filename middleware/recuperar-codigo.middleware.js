import Usuario from "../models/usuarios/usuarios.model.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^\d{10}$/;

const getMaxLength = (field, fallback) => {
    const len = Usuario.rawAttributes?.[field]?.type?.options?.length;
    return len || fallback;
};

export const validarRecuperacionCodigo = (req, res, next) => {
    const telefonoRaw = req.body?.telefono_personal;
    const emailRaw = req.body?.email;
    const fields = [];

    const maxTel = getMaxLength("telefono_personal", 10);
    const maxEmail = getMaxLength("email", 200);

    if (telefonoRaw === undefined || telefonoRaw === null || String(telefonoRaw).trim() === "") {
        fields.push({ field: "telefono_personal", reason: "El teléfono personal es obligatorio." });
    } else {
        const telefono = String(telefonoRaw).trim();
        if (!TEL_RE.test(telefono) || telefono.length > maxTel) {
            fields.push({ field: "telefono_personal", reason: `Debe contener exactamente ${maxTel} dígitos numéricos.` });
        } else {
            req.body.telefono_personal = telefono;
        }
    }

    if (emailRaw === undefined || emailRaw === null || String(emailRaw).trim() === "") {
        fields.push({ field: "email", reason: "El email es obligatorio." });
    } else {
        const email = String(emailRaw).trim().toLowerCase();
        if (!EMAIL_RE.test(email) || email.length > maxEmail) {
            fields.push({ field: "email", reason: `Formato inválido o excede ${maxEmail} caracteres.` });
        } else {
            req.body.email = email;
        }
    }

    if (fields.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Errores de validación en datos de recuperación.",
            fields
        });
    }

    return next();
};
