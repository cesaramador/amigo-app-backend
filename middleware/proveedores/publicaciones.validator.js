import { body, param, query, validationResult } from 'express-validator';
import Publicaciones from '../../models/proveedores/publicaciones.model.js';

const attrs = Publicaciones.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 800;
const sortableFields = [
    'id_publicacion',
    'id_proveedorconservicio',
    'fecha_registro_publicacion',
    'fecha_inicio_publicacion',
    'fecha_fin_publicacion',
    'id_estatus_publicacion'
];
const writeFields = [
    'id_proveedorconservicio',
    'imagen',
    'fecha_registro_publicacion',
    'fecha_inicio_publicacion',
    'fecha_fin_publicacion',
    'id_estatus_publicacion'
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

const idPublicacionParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const publicacionesGetValidation = [
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
    query('id_proveedorconservicio')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_proveedorconservicio debe ser un entero positivo')
        .toInt(),
    query('id_estatus_publicacion')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_estatus_publicacion debe ser un entero positivo')
        .toInt(),
    query('fecha_desde')
        .optional()
        .isISO8601()
        .withMessage('El parámetro fecha_desde no es una fecha válida'),
    query('fecha_hasta')
        .optional()
        .isISO8601()
        .withMessage('El parámetro fecha_hasta no es una fecha válida'),
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
    body('id_proveedorconservicio')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_proveedorconservicio debe ser un entero positivo')
        .toInt(),
    body('imagen')
        .optional({ nullable: true })
        .isString()
        .withMessage('El campo imagen no es válido')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('El campo imagen es obligatorio')
        .bail()
        .isLength({ max: getMaxLen('imagen') })
        .withMessage(`El campo imagen no puede exceder ${getMaxLen('imagen')} caracteres`),
    body('fecha_registro_publicacion')
        .optional()
        .isISO8601()
        .withMessage('El campo fecha_registro_publicacion debe ser una fecha válida (ISO 8601)'),
    body('fecha_inicio_publicacion')
        .optional()
        .isISO8601()
        .withMessage('El campo fecha_inicio_publicacion debe ser una fecha válida (ISO 8601)'),
    body('fecha_fin_publicacion')
        .optional()
        .isISO8601()
        .withMessage('El campo fecha_fin_publicacion debe ser una fecha válida (ISO 8601)'),
    body('id_estatus_publicacion')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_estatus_publicacion debe ser un entero positivo')
        .toInt()
];

const validateDatesOrder = body().custom((value, { req }) => {
    const inicio = req.body?.fecha_inicio_publicacion;
    const fin = req.body?.fecha_fin_publicacion;
    if (inicio !== undefined && fin !== undefined) {
        if (new Date(fin) <= new Date(inicio)) {
            throw new Error('La fecha_fin_publicacion debe ser posterior a la fecha_inicio_publicacion');
        }
    }
    return true;
});

const publicacionPostValidation = [
    ...sharedBodyRules,
    body('id_proveedorconservicio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_proveedorconservicio debe ser un entero positivo'),
    body('imagen')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo imagen es obligatorio'),
    body('fecha_registro_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_registro_publicacion es obligatorio y debe ser una fecha válida (ISO 8601)'),
    body('fecha_inicio_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_inicio_publicacion es obligatorio y debe ser una fecha válida (ISO 8601)'),
    body('fecha_fin_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_fin_publicacion es obligatorio y debe ser una fecha válida (ISO 8601)'),
    body('id_estatus_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_publicacion debe ser un entero positivo'),
    validateDatesOrder,
    validate
];

const publicacionPutValidation = [
    ...sharedBodyRules,
    body('id_proveedorconservicio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_proveedorconservicio debe ser un entero positivo'),
    body('imagen')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo imagen es obligatorio'),
    body('fecha_registro_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_registro_publicacion es obligatorio y debe ser una fecha válida (ISO 8601)'),
    body('fecha_inicio_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_inicio_publicacion es obligatorio y debe ser una fecha válida (ISO 8601)'),
    body('fecha_fin_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo fecha_fin_publicacion es obligatorio y debe ser una fecha válida (ISO 8601)'),
    body('id_estatus_publicacion')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_estatus_publicacion debe ser un entero positivo'),
    validateDatesOrder,
    validate
];

const publicacionPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const valid = keys.filter((key) => writeFields.includes(key));
        if (valid.length === 0) {
            throw new Error('Debe proporcionar al menos un campo para actualizar');
        }
        return true;
    }),
    validateDatesOrder,
    validate
];

export {
    publicacionesGetValidation,
    idPublicacionParamValidation,
    publicacionPostValidation,
    publicacionPutValidation,
    publicacionPatchValidation
};
