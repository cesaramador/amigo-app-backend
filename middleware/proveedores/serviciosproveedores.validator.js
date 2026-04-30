import { body, param, query, validationResult } from 'express-validator';
import ServiciosProveedores from '../../models/proveedores/serviciosproveedores.model.js';

const attrs = ServiciosProveedores.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 500;
const sortableFields = ['id_servicioproveedor', 'servicio_proveedor', 'id_tipo_servicio'];
const writeFields = ['servicio_proveedor', 'id_tipo_servicio'];

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

const idServicioProveedorParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const serviciosProveedoresGetValidation = [
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
    query('id_tipo_servicio')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_tipo_servicio debe ser un entero positivo')
        .toInt(),
    query('q')
        .optional()
        .isString()
        .withMessage('q debe ser texto.')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('servicio_proveedor') })
        .withMessage(`q no puede exceder ${getMaxLen('servicio_proveedor')} caracteres.`),
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
    body('servicio_proveedor')
        .optional({ nullable: true })
        .isString()
        .withMessage('El campo servicio_proveedor no es válido')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('El campo servicio_proveedor es obligatorio')
        .bail()
        .isLength({ max: getMaxLen('servicio_proveedor') })
        .withMessage(`El campo servicio_proveedor no puede exceder ${getMaxLen('servicio_proveedor')} caracteres`),
    body('id_tipo_servicio')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_tipo_servicio debe ser un entero positivo')
        .toInt()
];

const servicioProveedorBodyRequiredValidation = [
    ...sharedBodyRules,
    body('servicio_proveedor')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo servicio_proveedor es obligatorio'),
    body('id_tipo_servicio')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_tipo_servicio debe ser un entero positivo'),
    validate
];

const servicioProveedorBodyPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const valid = keys.filter((key) => writeFields.includes(key));
        if (valid.length === 0) {
            throw new Error('Debe proporcionar al menos un campo para actualizar: servicio_proveedor, id_tipo_servicio');
        }
        return true;
    }),
    validate
];

export {
    serviciosProveedoresGetValidation,
    idServicioProveedorParamValidation,
    servicioProveedorBodyRequiredValidation,
    servicioProveedorBodyPatchValidation
};
