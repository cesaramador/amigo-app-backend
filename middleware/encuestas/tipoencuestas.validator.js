import { body, param, query, validationResult } from 'express-validator';
import TipoEncuestas from '../../models/encuestas/tipoencuestas.model.js';

const attrs = TipoEncuestas.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 50;
const sortableFields = ['id_tipoencuesta', 'tipo_encuesta'];
const writeFields = ['tipo_encuesta'];

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

const idTipoEncuestaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const tipoEncuestasGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('tipo_encuesta') })
        .withMessage(`q no puede exceder ${getMaxLen('tipo_encuesta')} caracteres.`),
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

const sharedBodyRules = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => !writeFields.includes(key));
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_encuesta')
        .optional()
        .isString()
        .withMessage('El campo tipo_encuesta no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_encuesta') })
        .withMessage(`El campo tipo_encuesta no puede exceder ${getMaxLen('tipo_encuesta')} caracteres`)
];

const tipoEncuestaPostValidation = [
    ...sharedBodyRules,
    body('tipo_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_encuesta es obligatorio'),
    validate
];

const tipoEncuestaPutValidation = [
    ...sharedBodyRules,
    body('tipo_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_encuesta es obligatorio'),
    validate
];

const tipoEncuestaPatchValidation = [
    ...sharedBodyRules,
    body('tipo_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_encuesta es requerido'),
    validate
];

export {
    tipoEncuestasGetValidation,
    idTipoEncuestaParamValidation,
    tipoEncuestaPostValidation,
    tipoEncuestaPutValidation,
    tipoEncuestaPatchValidation
};
