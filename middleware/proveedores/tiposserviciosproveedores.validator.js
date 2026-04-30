import { body, param, query, validationResult } from 'express-validator';
import TiposServiciosProveedores from '../../models/proveedores/tiposserviciosproveedores.model.js';

const attrs = TiposServiciosProveedores.rawAttributes || {};
const getMaxLen = (field) => attrs[field]?.type?.options?.length ?? 500;
const sortableFields = ['id_tiposervicioproveedor', 'tipo_servicio_proveedor'];

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

const idTipoServicioProveedorParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const tiposServiciosProveedoresGetValidation = [
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
        .isLength({ min: 1, max: getMaxLen('tipo_servicio_proveedor') })
        .withMessage(`q no puede exceder ${getMaxLen('tipo_servicio_proveedor')} caracteres.`),
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

const tipoServicioProveedorBodyRequiredValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const unknown = keys.filter((key) => key !== 'tipo_servicio_proveedor');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_servicio_proveedor')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_servicio_proveedor es obligatorio')
        .bail()
        .isString()
        .withMessage('El campo tipo_servicio_proveedor no es válido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_servicio_proveedor') })
        .withMessage(`El campo tipo_servicio_proveedor no puede exceder ${getMaxLen('tipo_servicio_proveedor')} caracteres`),
    validate
];

const tipoServicioProveedorBodyPatchValidation = [
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('El campo tipo_servicio_proveedor es requerido');
        }
        const unknown = keys.filter((key) => key !== 'tipo_servicio_proveedor');
        if (unknown.length > 0) {
            throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
        }
        return true;
    }),
    body('tipo_servicio_proveedor')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo tipo_servicio_proveedor es requerido')
        .bail()
        .isString()
        .withMessage('El campo tipo_servicio_proveedor no es válido')
        .bail()
        .trim()
        .isLength({ min: 1, max: getMaxLen('tipo_servicio_proveedor') })
        .withMessage(`El campo tipo_servicio_proveedor no puede exceder ${getMaxLen('tipo_servicio_proveedor')} caracteres`),
    validate
];

export {
    tiposServiciosProveedoresGetValidation,
    idTipoServicioProveedorParamValidation,
    tipoServicioProveedorBodyRequiredValidation,
    tipoServicioProveedorBodyPatchValidation
};
