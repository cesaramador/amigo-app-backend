import { body, param, query, validationResult } from 'express-validator';
import Periodos from '../../models/grupos/periodos.model.js';

const attrs = Periodos.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 100;
const sortableFields = ['id_periodo', 'periodo', 'fecha_inicio', 'fecha_fin'];
const writeFields = ['periodo', 'fecha_inicio', 'fecha_fin'];

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

const normalizeEmptyToNull = (value) => (value === '' ? null : value);

const idPeriodoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const periodosGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('periodo') })
        .withMessage(`q no puede exceder ${getMaxLen('periodo')} caracteres.`),
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
    body('periodo')
        .optional()
        .isString()
        .withMessage('El campo periodo no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('periodo') })
        .withMessage(`El campo periodo no puede exceder ${getMaxLen('periodo')} caracteres`),
    body('fecha_inicio')
        .optional({ nullable: true })
        .customSanitizer(normalizeEmptyToNull)
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('El campo fecha_inicio debe ser una fecha valida (YYYY-MM-DD)')
        .toDate(),
    body('fecha_fin')
        .optional({ nullable: true })
        .customSanitizer(normalizeEmptyToNull)
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('El campo fecha_fin debe ser una fecha valida (YYYY-MM-DD)')
        .toDate(),
    body().custom((value, { req }) => {
        const { fecha_inicio, fecha_fin } = req.body || {};
        if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
            throw new Error('fecha_inicio no puede ser posterior a fecha_fin');
        }
        return true;
    })
];

const periodoPostValidation = [
    ...sharedBodyRules,
    body('periodo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo periodo es obligatorio'),
    validate
];

const periodoPutValidation = [
    ...sharedBodyRules,
    body('periodo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo periodo es obligatorio'),
    validate
];

const periodoPatchValidation = [
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
    periodosGetValidation,
    idPeriodoParamValidation,
    periodoPostValidation,
    periodoPutValidation,
    periodoPatchValidation
};
