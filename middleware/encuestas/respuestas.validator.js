import { body, param, query, validationResult } from 'express-validator';
import Respuestas from '../../models/encuestas/respuestas.model.js';

const attrs = Respuestas.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 500;
const sortableFields = ['id_respuesta', 'respuesta', 'id_estatus_enc_preg_resp'];
const writeFields = ['respuesta', 'id_estatus_enc_preg_resp'];

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

const idRespuestaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const respuestasGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('respuesta') })
        .withMessage(`q no puede exceder ${getMaxLen('respuesta')} caracteres.`),
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
    body('respuesta')
        .optional()
        .isString()
        .withMessage('El campo respuesta no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('respuesta') })
        .withMessage(`El campo respuesta no puede exceder ${getMaxLen('respuesta')} caracteres`),
    body('id_estatus_enc_preg_resp')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo')
        .toInt()
];

const respuestaPostValidation = [
    ...sharedBodyRules,
    body('respuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo respuesta es obligatorio'),
    body('id_estatus_enc_preg_resp')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo'),
    validate
];

const respuestaPutValidation = [
    ...sharedBodyRules,
    body('respuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo respuesta es obligatorio'),
    body('id_estatus_enc_preg_resp')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo'),
    validate
];

const respuestaPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error(`Debe proporcionar al menos un campo para actualizar: ${writeFields.join(', ')}`);
        }
        return true;
    }),
    validate
];

export {
    respuestasGetValidation,
    idRespuestaParamValidation,
    respuestaPostValidation,
    respuestaPutValidation,
    respuestaPatchValidation
};
