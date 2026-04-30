import { body, param, query, validationResult } from 'express-validator';
import TiposUsuarios from '../../models/usuarios/tiposusuarios.model.js';

const attrs = TiposUsuarios.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 50;
const sortableFields = ['id_tipousuario', 'tipo_usuario'];

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

const idTipoUsuarioParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const tiposusuariosGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('tipo_usuario') })
        .withMessage(`q no puede exceder ${getMaxLen('tipo_usuario')} caracteres.`),
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

const tipoUsuarioBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'tipo_usuario');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_usuario')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_usuario es obligatorio.')
        .bail()
        .isString()
        .withMessage('El campo tipo_usuario debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_usuario') })
        .withMessage(`El campo tipo_usuario no puede exceder ${getMaxLen('tipo_usuario')} caracteres.`),
    validate
];

const tipoUsuarioBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('No hay campos válidos para actualizar.');
        }
        const unknown = keys.filter((key) => key !== 'tipo_usuario');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_usuario')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_usuario es requerido.')
        .bail()
        .isString()
        .withMessage('El campo tipo_usuario debe ser texto no vacío.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_usuario') })
        .withMessage(`El campo tipo_usuario no puede exceder ${getMaxLen('tipo_usuario')} caracteres.`),
    validate
];

export {
    tiposusuariosGetValidation,
    idTipoUsuarioParamValidation,
    tipoUsuarioBodyRequiredValidation,
    tipoUsuarioBodyPatchValidation
};
