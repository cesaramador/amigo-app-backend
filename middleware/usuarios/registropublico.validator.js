import { body, validationResult } from 'express-validator';
import Usuario from '../../models/usuarios/usuarios.model.js';
import { ALLOWED_WRITE_FIELDS, EMAIL_RE, TEL_RE } from '../../helpers/usuario-registro-payload.js';

const attrs = Usuario.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length;

const PUBLIC_ALLOWED_WRITE_FIELDS = ALLOWED_WRITE_FIELDS.filter(
    (field) => !['id_tipousuario', 'id_estatus_usuario'].includes(field)
);

const integerBodyFields = PUBLIC_ALLOWED_WRITE_FIELDS.filter((field) => attrs[field]?.type?.key === 'INTEGER');
const stringBodyFields = PUBLIC_ALLOWED_WRITE_FIELDS.filter((field) => attrs[field]?.type?.key === 'STRING');

const requiredPublicFields = Object.keys(attrs).filter((name) => {
    const meta = attrs[name];
    return (
        meta.allowNull === false &&
        !meta.primaryKey &&
        meta.defaultValue === undefined &&
        name !== 'codigo' &&
        name !== 'fecha_registro' &&
        name !== 'id_tipousuario' &&
        name !== 'id_estatus_usuario'
    );
});

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(400).json({
        success: false,
        message: 'Errores de validación.',
        fields: errors.array().map((error) => ({
            field: error.path,
            reason: error.msg
        }))
    });
};

const registroPublicoPostValidation = [
    body().custom((value, { req }) => {
        const bodyKeys = Object.keys(req.body || {});
        const unknown = bodyKeys.filter((key) => !PUBLIC_ALLOWED_WRITE_FIELDS.includes(key));
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    ...requiredPublicFields.map((field) =>
        body(field)
            .exists({ checkNull: true, checkFalsy: true })
            .withMessage(`${field} es obligatorio.`)
    ),
    ...stringBodyFields.map((field) => {
        const maxLen = getMaxLen(field);
        return body(field)
            .optional({ nullable: true })
            .isString()
            .withMessage(`${field} debe ser texto.`)
            .bail()
            .customSanitizer((value) => (value == null ? value : String(value).trim()))
            .isLength({ max: maxLen })
            .withMessage(`${field} no puede exceder ${maxLen} caracteres.`);
    }),
    ...integerBodyFields.map((field) =>
        body(field)
            .optional()
            .isInt({ min: 1 })
            .withMessage(`${field} debe ser un entero positivo.`)
            .toInt()
    ),
    body('fecha_nacimiento')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('fecha_nacimiento debe ser una fecha válida en formato ISO8601.'),
    body('email')
        .optional({ nullable: true })
        .customSanitizer((value) => (value == null ? value : String(value).trim().toLowerCase()))
        .custom((value) => EMAIL_RE.test(String(value)))
        .withMessage('Formato de email inválido.'),
    body('telefono_personal')
        .optional({ nullable: true })
        .customSanitizer((value) => (value == null ? value : String(value).trim()))
        .custom((value) => TEL_RE.test(String(value)))
        .withMessage('telefono_personal tiene un formato inválido.')
        .bail()
        .isLength({ min: 10, max: 10 })
        .withMessage('telefono_personal debe contener exactamente 10 caracteres.'),
    body('telefono_contacto')
        .optional({ nullable: true })
        .customSanitizer((value) => (value == null ? value : String(value).trim()))
        .custom((value) => TEL_RE.test(String(value)))
        .withMessage('telefono_contacto tiene un formato inválido.')
        .bail()
        .isLength({ max: getMaxLen('telefono_contacto') })
        .withMessage(`telefono_contacto no puede exceder ${getMaxLen('telefono_contacto')} caracteres.`),
    body('codigo_postal')
        .optional({ nullable: true })
        .matches(/^\d{5}$/)
        .withMessage('codigo_postal debe contener exactamente 5 dígitos.'),
    validate
];

export {
    registroPublicoPostValidation,
    PUBLIC_ALLOWED_WRITE_FIELDS
};
