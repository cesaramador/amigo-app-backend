import { body, param, query, validationResult } from 'express-validator';
import PeriodosGrupos from '../../models/grupos/periodosgrupos.model.js';

const attrs = PeriodosGrupos.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 250;
const sortableFields = [
    'id_periodogrupo', 'id_grupo', 'id_periodo',
    'id_estatus_grupo', 'id_responsable_grupo', 'lugar_imparticion'
];
const writeFields = [
    'id_grupo', 'id_periodo', 'id_estatus_grupo',
    'id_responsable_grupo', 'hora_inicio', 'lugar_imparticion'
];

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

const idPeriodoGrupoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const periodosGruposGetValidation = [
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
    query('id_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_grupo debe ser un entero positivo')
        .toInt(),
    query('id_periodo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_periodo debe ser un entero positivo')
        .toInt(),
    query('id_estatus_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_estatus_grupo debe ser un entero positivo')
        .toInt(),
    query('id_responsable_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_responsable_grupo debe ser un entero positivo')
        .toInt(),
    query('q')
        .optional()
        .isString()
        .withMessage('q debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('lugar_imparticion') })
        .withMessage(`q no puede exceder ${getMaxLen('lugar_imparticion')} caracteres.`),
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
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => !writeFields.includes(key));
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('id_grupo')
        .optional({ nullable: true })
        .custom((value) => value === null || value === '' || Number.isInteger(Number(value)))
        .withMessage('El campo id_grupo debe ser un entero positivo o null')
        .bail()
        .isInt({ min: 1 })
        .withMessage('El campo id_grupo debe ser un entero positivo o null')
        .toInt(),
    body('id_periodo')
        .optional({ nullable: true })
        .custom((value) => value === null || value === '' || Number.isInteger(Number(value)))
        .withMessage('El campo id_periodo debe ser un entero positivo o null')
        .bail()
        .isInt({ min: 1 })
        .withMessage('El campo id_periodo debe ser un entero positivo o null')
        .toInt(),
    body('id_estatus_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_estatus_grupo debe ser un entero positivo')
        .toInt(),
    body('id_responsable_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_responsable_grupo debe ser un entero positivo')
        .toInt(),
    body('hora_inicio')
        .optional({ nullable: true })
        .custom((value) => value === null || value === '' || /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(value)))
        .withMessage('El campo hora_inicio debe tener formato HH:MM o HH:MM:SS')
        .bail()
        .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
        .withMessage('El campo hora_inicio debe tener formato HH:MM o HH:MM:SS'),
    body('lugar_imparticion')
        .optional({ nullable: true })
        .custom((value) => value === null || value === '' || typeof value === 'string')
        .withMessage('El campo lugar_imparticion debe ser una cadena de texto')
        .bail()
        .isString()
        .withMessage('El campo lugar_imparticion debe ser una cadena de texto')
        .bail()
        .trim()
        .isLength({ max: getMaxLen('lugar_imparticion') })
        .withMessage(`El campo lugar_imparticion no puede exceder ${getMaxLen('lugar_imparticion')} caracteres`)
];

const periodosGrupoPostValidation = [
    ...sharedBodyRules,
    body('id_estatus_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_grupo es obligatorio y debe ser un entero positivo'),
    body('id_responsable_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_responsable_grupo es obligatorio y debe ser un entero positivo'),
    validate
];

const periodosGrupoPutValidation = [
    ...sharedBodyRules,
    body('id_estatus_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_grupo es obligatorio y debe ser un entero positivo'),
    body('id_responsable_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_responsable_grupo es obligatorio y debe ser un entero positivo'),
    validate
];

const periodosGrupoPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const valid = Object.keys(req.body || {}).filter((key) => writeFields.includes(key));
        if (valid.length === 0) {
            throw new Error(`Se requiere al menos uno de los campos: ${writeFields.join(', ')}`);
        }
        return true;
    }),
    validate
];

export {
    periodosGruposGetValidation,
    idPeriodoGrupoParamValidation,
    periodosGrupoPostValidation,
    periodosGrupoPutValidation,
    periodosGrupoPatchValidation
};
