import { body, param, query, validationResult } from 'express-validator';
import Encuestas from '../../models/encuestas/encuestas.model.js';

const attrs = Encuestas.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 500;
const sortableFields = ['id_encuesta', 'nombre_encuesta', 'id_tipo_encuesta', 'id_estatus_enc_preg_resp'];
const writeFields = ['nombre_encuesta', 'id_tipo_encuesta', 'id_estatus_enc_preg_resp'];

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

const idEncuestaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const encuestasGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('nombre_encuesta') })
        .withMessage(`q no puede exceder ${getMaxLen('nombre_encuesta')} caracteres.`),
    query('id_tipo_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_tipo_encuesta debe ser un entero positivo')
        .toInt(),
    query('id_estatus_enc_preg_resp')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_estatus_enc_preg_resp debe ser un entero positivo')
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
    body('nombre_encuesta')
        .optional()
        .isString()
        .withMessage('El campo nombre_encuesta no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('nombre_encuesta') })
        .withMessage(`El campo nombre_encuesta no puede exceder ${getMaxLen('nombre_encuesta')} caracteres`),
    body('id_tipo_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_tipo_encuesta debe ser un entero positivo')
        .toInt(),
    body('id_estatus_enc_preg_resp')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo')
        .toInt()
];

const encuestaPostValidation = [
    ...sharedBodyRules,
    body('nombre_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo nombre_encuesta es obligatorio'),
    body('id_tipo_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_tipo_encuesta es obligatorio y debe ser un entero positivo'),
    body('id_estatus_enc_preg_resp')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_enc_preg_resp es obligatorio y debe ser un entero positivo'),
    validate
];

const encuestaPutValidation = [
    ...sharedBodyRules,
    body('nombre_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo nombre_encuesta es obligatorio'),
    body('id_tipo_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_tipo_encuesta es obligatorio y debe ser un entero positivo'),
    body('id_estatus_enc_preg_resp')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_enc_preg_resp es obligatorio y debe ser un entero positivo'),
    validate
];

const encuestaPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error(`Se requiere al menos uno de los campos: ${writeFields.join(', ')}`);
        }
        return true;
    }),
    validate
];

export {
    encuestasGetValidation,
    idEncuestaParamValidation,
    encuestaPostValidation,
    encuestaPutValidation,
    encuestaPatchValidation
};
