import { body, param, query, validationResult } from 'express-validator';

const sortableFields = [
    'id_encuesta_pregunta_respuesta', 'id_encuesta', 'id_pregunta', 'id_respuesta'
];
const writeFields = ['id_encuesta', 'id_pregunta', 'id_respuesta'];

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

const idEncuestaPreguntaRespuestaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const encuestasPreguntasRespuestasGetValidation = [
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
    query('id_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_encuesta debe ser un entero positivo')
        .toInt(),
    query('id_pregunta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_pregunta debe ser un entero positivo')
        .toInt(),
    query('id_respuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_respuesta debe ser un entero positivo')
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
    body('id_pregunta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_pregunta debe ser un entero positivo')
        .toInt(),
    body('id_respuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_respuesta debe ser un entero positivo')
        .toInt()
];

const encuestaPreguntaRespuestaPostValidation = [
    ...sharedBodyRules,
    body('id_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_encuesta es obligatorio y debe ser un entero positivo'),
    body('id_pregunta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_pregunta es obligatorio y debe ser un entero positivo'),
    body('id_respuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_respuesta es obligatorio y debe ser un entero positivo'),
    validate
];

const encuestaPreguntaRespuestaPutValidation = [
    ...sharedBodyRules,
    body('id_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_encuesta es obligatorio y debe ser un entero positivo'),
    body('id_pregunta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_pregunta es obligatorio y debe ser un entero positivo'),
    body('id_respuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_respuesta es obligatorio y debe ser un entero positivo'),
    validate
];

const encuestaPreguntaRespuestaPatchValidation = [
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
    encuestasPreguntasRespuestasGetValidation,
    idEncuestaPreguntaRespuestaParamValidation,
    encuestaPreguntaRespuestaPostValidation,
    encuestaPreguntaRespuestaPutValidation,
    encuestaPreguntaRespuestaPatchValidation
};
