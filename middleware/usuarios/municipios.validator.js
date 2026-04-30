import { body, param, query, validationResult } from 'express-validator';
import Municipio from '../../models/usuarios/municipios.model.js';

const attrs = Municipio.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 100;
const sortableFields = ['id_municipio', 'municipio', 'id_estado', 'num_municipio'];
const writeFields = ['id_estado', 'num_municipio', 'municipio'];

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

const idMunicipioParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const municipiosGetValidation = [
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
    query('id_estado')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_estado de filtro inválido.')
        .toInt(),
    query('q')
        .optional()
        .isString()
        .withMessage('q debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('municipio') })
        .withMessage(`q no puede exceder ${getMaxLen('municipio')} caracteres.`),
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
    body().custom((value, { req }) => {
        const bodyKeys = Object.keys(req.body || {});
        const unknown = bodyKeys.filter((key) => !writeFields.includes(key));
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('id_estado')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_estado debe ser un entero positivo.')
        .toInt(),
    body('num_municipio')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo num_municipio debe ser un entero positivo.')
        .toInt(),
    body('municipio')
        .optional({ nullable: true })
        .isString()
        .withMessage('El campo municipio debe ser texto.')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('El campo municipio debe ser texto no vacío.')
        .bail()
        .isLength({ max: getMaxLen('municipio') })
        .withMessage(`El campo municipio no puede exceder ${getMaxLen('municipio')} caracteres.`)
];

const municipioPostValidation = [
    ...sharedBodyRules,
    body('id_estado')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estado es obligatorio y debe ser un entero positivo.'),
    body('num_municipio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo num_municipio es obligatorio y debe ser un entero positivo.'),
    body('municipio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo municipio es obligatorio y debe ser texto.'),
    validate
];

const municipioPutValidation = [
    ...sharedBodyRules,
    body('id_estado')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estado debe ser un entero positivo.'),
    body('num_municipio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo num_municipio debe ser un entero positivo.'),
    body('municipio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo municipio debe ser texto no vacío.'),
    validate
];

const municipioPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const bodyKeys = Object.keys(req.body || {});
        const validKeys = bodyKeys.filter((key) => writeFields.includes(key));
        if (validKeys.length === 0) {
            throw new Error('Se debe proporcionar al menos un campo para actualizar.');
        }
        return true;
    }),
    validate
];

export {
    municipiosGetValidation,
    idMunicipioParamValidation,
    municipioPostValidation,
    municipioPutValidation,
    municipioPatchValidation
};
