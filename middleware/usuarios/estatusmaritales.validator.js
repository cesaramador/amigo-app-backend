import { body, param, query, validationResult } from 'express-validator';
import EstatusMaritales from '../../models/usuarios/estatusmaritales.model.js';

const attrs = EstatusMaritales.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 20;
const sortableFields = ['id_estatusmarital', 'estatus_marital'];

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

const idEstatusMaritalParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const estatusmaritalesGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('estatus_marital') })
        .withMessage(`q no puede exceder ${getMaxLen('estatus_marital')} caracteres.`),
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

const estatusMaritalBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'estatus_marital');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('estatus_marital')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_marital es obligatorio y debe ser texto.')
        .bail()
        .isString()
        .withMessage('El campo estatus_marital debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('estatus_marital') })
        .withMessage(`El campo estatus_marital no puede exceder ${getMaxLen('estatus_marital')} caracteres.`),
    validate
];

const estatusMaritalBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('El campo estatus_marital es requerido.');
        }
        const unknown = keys.filter((key) => key !== 'estatus_marital');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('estatus_marital')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_marital es requerido.')
        .bail()
        .isString()
        .withMessage('El campo estatus_marital debe ser texto no vacío.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('estatus_marital') })
        .withMessage(`El campo estatus_marital no puede exceder ${getMaxLen('estatus_marital')} caracteres.`),
    validate
];

export {
    estatusmaritalesGetValidation,
    idEstatusMaritalParamValidation,
    estatusMaritalBodyRequiredValidation,
    estatusMaritalBodyPatchValidation
};
