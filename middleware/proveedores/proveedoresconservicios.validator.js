import { body, param, query, validationResult } from 'express-validator';

const sortableFields = [
    'id_proveedorconservicio',
    'id_usuario',
    'id_servicio_proveedor'
];
const writeFields = ['id_usuario', 'id_servicio_proveedor'];

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

const idProveedorConServicioParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido: debe ser un entero positivo')
        .toInt(),
    validate
];

const proveedoresConServiciosGetValidation = [
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
        .withMessage('El parámetro id_usuario debe ser un entero positivo')
        .toInt(),
    query('id_servicio_proveedor')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parámetro id_servicio_proveedor debe ser un entero positivo')
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
    body('id_usuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_usuario debe ser un entero positivo')
        .toInt(),
    body('id_servicio_proveedor')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_servicio_proveedor debe ser un entero positivo')
        .toInt()
];

const proveedorConServicioBodyRequiredValidation = [
    ...sharedBodyRules,
    body('id_usuario')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_usuario debe ser un entero positivo'),
    body('id_servicio_proveedor')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_servicio_proveedor debe ser un entero positivo'),
    validate
];

const proveedorConServicioBodyPatchValidation = [
    ...sharedBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        const valid = keys.filter((key) => writeFields.includes(key));
        if (valid.length === 0) {
            throw new Error('Debe proporcionar al menos un campo para actualizar: id_usuario, id_servicio_proveedor');
        }
        return true;
    }),
    validate
];

export {
    proveedoresConServiciosGetValidation,
    idProveedorConServicioParamValidation,
    proveedorConServicioBodyRequiredValidation,
    proveedorConServicioBodyPatchValidation
};
