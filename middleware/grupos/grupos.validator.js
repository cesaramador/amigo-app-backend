import { body, param, query, validationResult } from 'express-validator';
import Grupos from '../../models/grupos/grupos.model.js';

const attrs = Grupos.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 200;
const sortableFields = ['id_grupo', 'nombre_grupo', 'id_tipogrupo'];
const writeFields = ['nombre_grupo', 'id_tipogrupo'];

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

const normalizeNullableInt = (value) => (value === '' ? null : value);

const idGrupoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const gruposGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('nombre_grupo') })
        .withMessage(`q no puede exceder ${getMaxLen('nombre_grupo')} caracteres.`),
    query('id_tipogrupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_tipogrupo debe ser un entero positivo')
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
    body('nombre_grupo')
        .optional()
        .isString()
        .withMessage('El campo nombre_grupo no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('nombre_grupo') })
        .withMessage(`El campo nombre_grupo no puede exceder ${getMaxLen('nombre_grupo')} caracteres`),
    body('id_tipogrupo')
        .optional({ nullable: true })
        .customSanitizer(normalizeNullableInt)
        .custom((value) => value === null || (Number.isInteger(Number(value)) && Number(value) > 0))
        .withMessage('El campo id_tipogrupo debe ser un entero positivo o null')
        .customSanitizer((value) => (value === null ? null : Number(value)))
];

const grupoPostValidation = [
    ...sharedBodyRules,
    body('nombre_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo nombre_grupo es obligatorio'),
    validate
];

const grupoPutValidation = [
    ...sharedBodyRules,
    body('nombre_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo nombre_grupo es obligatorio'),
    validate
];

const grupoPatchValidation = [
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
    gruposGetValidation,
    idGrupoParamValidation,
    grupoPostValidation,
    grupoPutValidation,
    grupoPatchValidation
};
