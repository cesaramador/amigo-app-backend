import { body, param, query, validationResult } from 'express-validator';
import EstatusPublicaciones from '../../models/proveedores/estatuspublicaciones.model.js';

const attrs = EstatusPublicaciones.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 20;
const sortableFields = ['id_estatuspublicacion', 'estatus_publicacion'];

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

const idEstatusPublicacionParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const estatusPublicacionesGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('estatus_publicacion') })
        .withMessage(`q no puede exceder ${getMaxLen('estatus_publicacion')} caracteres.`),
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

const estatusPublicacionBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'estatus_publicacion');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('estatus_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_publicacion es obligatorio')
        .bail()
        .isString()
        .withMessage('El campo estatus_publicacion no es válido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('estatus_publicacion') })
        .withMessage(`El campo estatus_publicacion no puede exceder ${getMaxLen('estatus_publicacion')} caracteres`),
    validate
];

const estatusPublicacionBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('El campo estatus_publicacion es requerido');
        }
        const unknown = keys.filter((key) => key !== 'estatus_publicacion');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('estatus_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_publicacion es requerido')
        .bail()
        .isString()
        .withMessage('El campo estatus_publicacion no es válido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('estatus_publicacion') })
        .withMessage(`El campo estatus_publicacion no puede exceder ${getMaxLen('estatus_publicacion')} caracteres`),
    validate
];

export {
    estatusPublicacionesGetValidation,
    idEstatusPublicacionParamValidation,
    estatusPublicacionBodyRequiredValidation,
    estatusPublicacionBodyPatchValidation
};
