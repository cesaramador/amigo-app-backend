import { body, param, query, validationResult } from 'express-validator';
import InterpretacionResultados from '../../models/encuestas/interpretacionresultados.model.js';

const attrs = InterpretacionResultados.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 500;
const sortableFields = [
    'id_interpreta_resultado',
    'id_encuesta',
    'puntuacion',
    'gravedad',
    'acciones_propuestas'
];
const writeFields = ['id_encuesta', 'puntuacion', 'gravedad', 'acciones_propuestas'];

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

const idInterpretacionResultadoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const interpretacionResultadosGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('acciones_propuestas') })
        .withMessage(`q no puede exceder ${getMaxLen('acciones_propuestas')} caracteres.`),
    query('id_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_encuesta debe ser un entero positivo')
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
    body('id_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_encuesta debe ser un entero positivo')
        .toInt(),
    body('puntuacion')
        .optional()
        .isInt()
        .withMessage('El campo puntuacion debe ser un numero entero')
        .toInt(),
    body('gravedad')
        .optional()
        .isString()
        .withMessage('El campo gravedad no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('gravedad') })
        .withMessage(`El campo gravedad no puede exceder ${getMaxLen('gravedad')} caracteres`),
    body('acciones_propuestas')
        .optional()
        .isString()
        .withMessage('El campo acciones_propuestas no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('acciones_propuestas') })
        .withMessage(`El campo acciones_propuestas no puede exceder ${getMaxLen('acciones_propuestas')} caracteres`)
];

const interpretacionResultadoPostValidation = [
    ...sharedBodyRules,
    body('id_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_encuesta debe ser un entero positivo'),
    body('puntuacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo puntuacion debe ser un numero entero'),
    body('gravedad')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo gravedad es obligatorio'),
    body('acciones_propuestas')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo acciones_propuestas es obligatorio'),
    validate
];

const interpretacionResultadoPutValidation = [
    ...sharedBodyRules,
    body('id_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_encuesta debe ser un entero positivo'),
    body('puntuacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo puntuacion debe ser un numero entero'),
    body('gravedad')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo gravedad es obligatorio'),
    body('acciones_propuestas')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo acciones_propuestas es obligatorio'),
    validate
];

const interpretacionResultadoPatchValidation = [
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
    interpretacionResultadosGetValidation,
    idInterpretacionResultadoParamValidation,
    interpretacionResultadoPostValidation,
    interpretacionResultadoPutValidation,
    interpretacionResultadoPatchValidation
};
