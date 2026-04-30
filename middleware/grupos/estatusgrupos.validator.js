import { body, param, query, validationResult } from 'express-validator';
import EstatusGrupos from '../../models/grupos/estatusgrupos.model.js';

const attrs = EstatusGrupos.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 20;
const sortableFields = ['id_estatusgrupo', 'estatus_grupo'];
const writeFields = ['estatus_grupo'];

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

const idEstatusGrupoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const estatusGruposGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('estatus_grupo') })
        .withMessage(`q no puede exceder ${getMaxLen('estatus_grupo')} caracteres.`),
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
    body('estatus_grupo')
        .optional()
        .isString()
        .withMessage('El campo estatus_grupo no es valido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('estatus_grupo') })
        .withMessage(`El campo estatus_grupo no puede exceder ${getMaxLen('estatus_grupo')} caracteres`)
];

const estatusGrupoPostValidation = [
    ...sharedBodyRules,
    body('estatus_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_grupo es obligatorio'),
    validate
];

const estatusGrupoPutValidation = [
    ...sharedBodyRules,
    body('estatus_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_grupo es obligatorio'),
    validate
];

const estatusGrupoPatchValidation = [
    ...sharedBodyRules,
    body('estatus_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo estatus_grupo es requerido'),
    validate
];

export {
    estatusGruposGetValidation,
    idEstatusGrupoParamValidation,
    estatusGrupoPostValidation,
    estatusGrupoPutValidation,
    estatusGrupoPatchValidation
};
