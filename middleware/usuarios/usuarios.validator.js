import { body, param, query, validationResult } from 'express-validator';
import Usuario from '../../models/usuarios/usuarios.model.js';
import { ALLOWED_WRITE_FIELDS, EMAIL_RE, TEL_RE } from '../../helpers/usuario-registro-payload.js';

const attrs = Usuario.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length;
const integerBodyFields = ALLOWED_WRITE_FIELDS.filter((field) => attrs[field]?.type?.key === 'INTEGER');
const stringBodyFields = ALLOWED_WRITE_FIELDS.filter((field) => attrs[field]?.type?.key === 'STRING');
const sortableFields = ['id_usuario', 'nombre', 'fecha_registro', 'id_tipousuario', 'ap_paterno'];

const requiredWriteFields = Object.keys(attrs).filter((name) => {
    const meta = attrs[name];
    return (
        meta.allowNull === false &&
        !meta.primaryKey &&
        meta.defaultValue === undefined &&
        name !== 'codigo' &&
        name !== 'fecha_registro'
    );
});

const ensureNoUnknownBodyFields = body().custom((value, { req }) => {
    const bodyKeys = Object.keys(req.body || {});
    const unknown = bodyKeys.filter((key) => !ALLOWED_WRITE_FIELDS.includes(key));
    if (unknown.length > 0) {
        throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
    }
    return true;
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

const idUsuarioParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido. Debe ser un entero positivo.'),
    validate
];

const usuariosGetValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un entero positivo.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un entero entre 1 y 100.')
        .toInt(),
    query('q')
        .optional()
        .isString()
        .withMessage('q debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('q debe tener entre 1 y 100 caracteres.'),
    query('id_genero')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_genero debe ser un entero positivo.')
        .toInt(),
    query('id_estatus_usuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_estatus_usuario debe ser un entero positivo.')
        .toInt(),
    query('id_tipousuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_tipousuario debe ser un entero positivo.')
        .toInt(),
    query('id_estado')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_estado debe ser un entero positivo.')
        .toInt(),
    query('id_municipio')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_municipio debe ser un entero positivo.')
        .toInt(),
    query('sort')
        .optional()
        .custom((value) => {
            const [field, direction] = String(value).split(':');
            if (!field || !direction) {
                throw new Error('sort debe usar el formato campo:asc|desc.');
            }
            if (!sortableFields.includes(field)) {
                throw new Error(`Campo de sort no permitido: ${field}.`);
            }
            if (!['asc', 'desc'].includes(direction.toLowerCase())) {
                throw new Error('Dirección de sort inválida. Usa asc o desc.');
            }
            return true;
        }),
    validate
];

const sharedBodyRules = [
    ensureNoUnknownBodyFields,
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
        .withMessage('codigo_postal debe contener exactamente 5 dígitos.')
];

const usuarioPostValidation = [
    ...sharedBodyRules,
    ...requiredWriteFields.map((field) =>
        body(field)
            .exists({ checkNull: true, checkFalsy: true })
            .withMessage(`${field} es obligatorio.`)
    ),
    validate
];

const usuarioPutValidation = [
    ...sharedBodyRules,
    ...requiredWriteFields.map((field) =>
        body(field)
            .exists({ checkNull: true, checkFalsy: true })
            .withMessage(`${field} es obligatorio en PUT.`)
    ),
    validate
];

const usuarioPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const bodyKeys = Object.keys(req.body || {});
        const validKeys = bodyKeys.filter((key) => ALLOWED_WRITE_FIELDS.includes(key));
        if (validKeys.length === 0) {
            throw new Error('No hay campos válidos para actualizar.');
        }
        return true;
    }),
    validate
];

export {
    usuariosGetValidation,
    idUsuarioParamValidation,
    usuarioPostValidation,
    usuarioPutValidation,
    usuarioPatchValidation
};
