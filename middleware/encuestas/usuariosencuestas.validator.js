import { body, param, query, validationResult } from 'express-validator';

const sortableFields = [
    'id_usuario_encuesta',
    'id_usuario',
    'id_encuesta',
    'fecha_elaboracion_encuesta'
];
const writeFields = ['id_usuario', 'id_encuesta', 'fecha_elaboracion_encuesta'];

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

const idUsuarioEncuestaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const usuariosEncuestasGetValidation = [
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
    query('id_usuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_usuario debe ser un entero positivo')
        .toInt(),
    query('id_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_encuesta debe ser un entero positivo')
        .toInt(),
    query('fecha_desde')
        .optional()
        .isISO8601()
        .withMessage('El parametro fecha_desde no es una fecha valida')
        .toDate(),
    query('fecha_hasta')
        .optional()
        .isISO8601()
        .withMessage('El parametro fecha_hasta no es una fecha valida')
        .toDate(),
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
    body('id_usuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_usuario debe ser un entero positivo')
        .toInt(),
    body('id_encuesta')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_encuesta debe ser un entero positivo')
        .toInt(),
    body('fecha_elaboracion_encuesta')
        .optional()
        .isISO8601()
        .withMessage('El campo fecha_elaboracion_encuesta debe ser una fecha valida (ISO 8601)')
        .toDate()
];

const usuariosEncuestaPostValidation = [
    ...sharedBodyRules,
    body('id_usuario')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_usuario debe ser un entero positivo'),
    body('id_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_encuesta debe ser un entero positivo'),
    body('fecha_elaboracion_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_elaboracion_encuesta es obligatorio y debe ser una fecha valida (ISO 8601)'),
    validate
];

const usuariosEncuestaPutValidation = [
    ...sharedBodyRules,
    body('id_usuario')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_usuario debe ser un entero positivo'),
    body('id_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_encuesta debe ser un entero positivo'),
    body('fecha_elaboracion_encuesta')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_elaboracion_encuesta es obligatorio y debe ser una fecha valida (ISO 8601)'),
    validate
];

const usuariosEncuestaPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error(`Debe proporcionar al menos un campo: ${writeFields.join(', ')}`);
        }
        return true;
    }),
    validate
];

export {
    usuariosEncuestasGetValidation,
    idUsuarioEncuestaParamValidation,
    usuariosEncuestaPostValidation,
    usuariosEncuestaPutValidation,
    usuariosEncuestaPatchValidation
};
