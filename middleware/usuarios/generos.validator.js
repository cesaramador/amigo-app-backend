import { body, param, query, validationResult } from 'express-validator';
import Genero from '../../models/usuarios/generos.model.js';

const attrs = Genero.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 10;
const sortableFields = ['id_genero', 'genero'];

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

const idGeneroParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const generosGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('genero') })
        .withMessage(`q no puede exceder ${getMaxLen('genero')} caracteres.`),
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

const generoBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'genero');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('genero')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo genero es obligatorio y debe ser texto.')
        .bail()
        .isString()
        .withMessage('El campo genero debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('genero') })
        .withMessage(`El campo genero no puede exceder ${getMaxLen('genero')} caracteres.`),
    validate
];

const generoBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('El campo genero es requerido.');
        }
        const unknown = keys.filter((key) => key !== 'genero');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('genero')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo genero es requerido.')
        .bail()
        .isString()
        .withMessage('El campo genero debe ser texto no vacío.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('genero') })
        .withMessage(`El campo genero no puede exceder ${getMaxLen('genero')} caracteres.`),
    validate
];

export {
    generosGetValidation,
    idGeneroParamValidation,
    generoBodyRequiredValidation,
    generoBodyPatchValidation
};
