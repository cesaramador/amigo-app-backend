import { body, param, query, validationResult } from 'express-validator';
import Preguntas from '../../models/encuestas/preguntas.model.js';

const attrs = Preguntas.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 500;
const sortableFields = ['id_pregunta', 'pregunta', 'id_estatus_enc_preg_resp'];
const writeFields = ['pregunta', 'id_estatus_enc_preg_resp'];

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

const idPreguntaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const preguntasGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('pregunta') })
        .withMessage(`q no puede exceder ${getMaxLen('pregunta')} caracteres.`),
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
    body('pregunta')
        .optional()
        .isString()
        .withMessage('El campo pregunta no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('pregunta') })
        .withMessage(`El campo pregunta no puede exceder ${getMaxLen('pregunta')} caracteres`),
    body('id_estatus_enc_preg_resp')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo')
        .toInt()
];

const preguntaPostValidation = [
    ...sharedBodyRules,
    body('pregunta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo pregunta es obligatorio'),
    body('id_estatus_enc_preg_resp')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo'),
    validate
];

const preguntaPutValidation = [
    ...sharedBodyRules,
    body('pregunta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo pregunta es obligatorio'),
    body('id_estatus_enc_preg_resp')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_enc_preg_resp debe ser un entero positivo'),
    validate
];

const preguntaPatchValidation = [
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
    preguntasGetValidation,
    idPreguntaParamValidation,
    preguntaPostValidation,
    preguntaPutValidation,
    preguntaPatchValidation
};
