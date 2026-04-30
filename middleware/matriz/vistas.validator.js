import { body, param, query, validationResult } from 'express-validator';
import Vistas from '../../models/matriz/vistas.model.js';

const attrs = Vistas.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 100;
const sortableFields = ['id_vista', 'vista'];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(400).json({
        success: false,
        message: 'Errores de validacion.',
        fields: errors.array().map((error) => ({
            field: error.path,
            reason: error.msg
        }))
    });
};

const idVistaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const vistasGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('vista') })
        .withMessage(`q no puede exceder ${getMaxLen('vista')} caracteres.`),
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
                throw new Error('Direccion de sort invalida. Usa asc o desc.');
            }
            return true;
        }),
    validate
];

const vistaBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'vista');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('vista')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo vista es obligatorio.')
        .bail()
        .isString()
        .withMessage('El campo vista debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('vista') })
        .withMessage(`El campo vista no puede exceder ${getMaxLen('vista')} caracteres.`),
    validate
];

const vistaBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('Se requiere al menos un campo para actualizar.');
        }
        const unknown = keys.filter((key) => key !== 'vista');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('vista')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo vista es requerido.')
        .bail()
        .isString()
        .withMessage('El campo vista debe ser texto no vacio.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('vista') })
        .withMessage(`El campo vista no puede exceder ${getMaxLen('vista')} caracteres.`),
    validate
];

export {
    vistasGetValidation,
    idVistaParamValidation,
    vistaBodyRequiredValidation,
    vistaBodyPatchValidation
};
