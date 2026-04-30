import { body, param, query, validationResult } from 'express-validator';

const sortableFields = ['id_asistencia', 'id_inscripciongrupo', 'fecha', 'asistencia'];
const writeFields = ['id_inscripciongrupo', 'fecha', 'asistencia'];

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

const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return value;
};

const idAsistenciaParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const asistenciasGetValidation = [
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
    query('id_inscripciongrupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_inscripciongrupo debe ser un entero positivo')
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
    query('asistencia')
        .optional()
        .customSanitizer(normalizeBoolean)
        .isBoolean()
        .withMessage('El parametro asistencia debe ser true o false')
        .toBoolean(),
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
    body('id_inscripciongrupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_inscripciongrupo debe ser un entero positivo')
        .toInt(),
    body('fecha')
        .optional()
        .isISO8601()
        .withMessage('El campo fecha no es una fecha valida')
        .toDate(),
    body('asistencia')
        .optional()
        .customSanitizer(normalizeBoolean)
        .isBoolean()
        .withMessage('El campo asistencia debe ser true o false')
        .toBoolean()
];

const asistenciaPostValidation = [
    ...sharedBodyRules,
    body('id_inscripciongrupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_inscripciongrupo es obligatorio y debe ser un entero positivo'),
    body('fecha')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha es obligatorio'),
    body('asistencia')
        .exists({ checkNull: true })
        .withMessage('El campo asistencia es obligatorio y debe ser true o false'),
    validate
];

const asistenciaPutValidation = [
    ...sharedBodyRules,
    body('id_inscripciongrupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_inscripciongrupo es obligatorio y debe ser un entero positivo'),
    body('fecha')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha es obligatorio'),
    body('asistencia')
        .exists({ checkNull: true })
        .withMessage('El campo asistencia es obligatorio y debe ser true o false'),
    validate
];

const asistenciaPatchValidation = [
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
    asistenciasGetValidation,
    idAsistenciaParamValidation,
    asistenciaPostValidation,
    asistenciaPutValidation,
    asistenciaPatchValidation
};
