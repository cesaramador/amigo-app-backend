import { body, param, query, validationResult } from 'express-validator';
import CategoriasViviendas from '../../models/usuarios/categoriasviviendas.model.js';

const attrs = CategoriasViviendas.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 20;
const sortableFields = ['id_categoriavivienda', 'categoria_vivienda'];

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

const idCategoriaViviendaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const categoriasViviendasGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('categoria_vivienda') })
        .withMessage(`q no puede exceder ${getMaxLen('categoria_vivienda')} caracteres.`),
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

const categoriaViviendaBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'categoria_vivienda');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('categoria_vivienda')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo categoria_vivienda es obligatorio y debe ser texto.')
        .bail()
        .isString()
        .withMessage('El campo categoria_vivienda debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('categoria_vivienda') })
        .withMessage(`El campo categoria_vivienda no puede exceder ${getMaxLen('categoria_vivienda')} caracteres.`),
    validate
];

const categoriaViviendaBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('El campo categoria_vivienda es requerido.');
        }
        const unknown = keys.filter((key) => key !== 'categoria_vivienda');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('categoria_vivienda')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo categoria_vivienda es requerido.')
        .bail()
        .isString()
        .withMessage('El campo categoria_vivienda debe ser texto no vacío.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('categoria_vivienda') })
        .withMessage(`El campo categoria_vivienda no puede exceder ${getMaxLen('categoria_vivienda')} caracteres.`),
    validate
];

export {
    categoriasViviendasGetValidation,
    idCategoriaViviendaParamValidation,
    categoriaViviendaBodyRequiredValidation,
    categoriaViviendaBodyPatchValidation
};
