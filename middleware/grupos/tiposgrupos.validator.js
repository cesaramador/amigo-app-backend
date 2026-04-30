import { body, param, query, validationResult } from 'express-validator';
import TiposGrupos from '../../models/grupos/tiposgrupos.model.js';

const attrs = TiposGrupos.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 100;
const sortableFields = ['id_tipogrupo', 'tipo_grupo'];

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

const idTipoGrupoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const tiposGruposGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('tipo_grupo') })
        .withMessage(`q no puede exceder ${getMaxLen('tipo_grupo')} caracteres.`),
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

const tipoGrupoBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'tipo_grupo');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_grupo es obligatorio')
        .bail()
        .isString()
        .withMessage('El campo tipo_grupo no es válido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_grupo') })
        .withMessage(`El campo tipo_grupo no puede exceder ${getMaxLen('tipo_grupo')} caracteres`),
    validate
];

const tipoGrupoBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('El campo tipo_grupo es requerido');
        }
        const unknown = keys.filter((key) => key !== 'tipo_grupo');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_grupo es requerido')
        .bail()
        .isString()
        .withMessage('El campo tipo_grupo no es válido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_grupo') })
        .withMessage(`El campo tipo_grupo no puede exceder ${getMaxLen('tipo_grupo')} caracteres`),
    validate
];

export {
    tiposGruposGetValidation,
    idTipoGrupoParamValidation,
    tipoGrupoBodyRequiredValidation,
    tipoGrupoBodyPatchValidation
};
