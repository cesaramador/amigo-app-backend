import { body, param, query, validationResult } from 'express-validator';

const sortableFields = ['id_matrizacceso', 'id_tipousuario', 'id_vista', 'estatus'];
const allowedBodyFields = ['id_tipousuario', 'id_vista', 'estatus'];

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

const idMatrizAccesoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido. Debe ser un entero positivo.')
        .toInt(),
    validate
];

const matrizaccesosGetValidation = [
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
    query('id_tipousuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_tipousuario debe ser un entero positivo.')
        .toInt(),
    query('id_vista')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_vista debe ser un entero positivo.')
        .toInt(),
    query('estatus')
        .optional()
        .isBoolean()
        .withMessage('estatus debe ser booleano (true/false).')
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

const ensureNoUnknownBodyFields = body().custom((value, { req }) => {
    const keys = Object.keys(req.body || {});
    const unknown = keys.filter((key) => !allowedBodyFields.includes(key));
    if (unknown.length > 0) {
        throw new Error(`Campos no permitidos en el body: ${unknown.join(', ')}`);
    }
    return true;
});

const baseBodyRules = [
    ensureNoUnknownBodyFields,
    body('id_tipousuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_tipousuario debe ser un entero positivo.')
        .toInt(),
    body('id_vista')
        .optional()
        .isInt({ min: 1 })
        .withMessage('id_vista debe ser un entero positivo.')
        .toInt(),
    body('estatus')
        .optional()
        .isBoolean()
        .withMessage('estatus debe ser booleano (true/false).')
        .toBoolean()
];

const matrizaccesoBodyRequiredValidation = [
    ...baseBodyRules,
    body('id_tipousuario')
        .exists({ checkNull: true })
        .withMessage('id_tipousuario es obligatorio.'),
    body('id_vista')
        .exists({ checkNull: true })
        .withMessage('id_vista es obligatorio.'),
    body('estatus')
        .exists({ checkNull: true })
        .withMessage('estatus es obligatorio.'),
    validate
];

const matrizaccesoBodyPatchValidation = [
    ...baseBodyRules,
    body().custom((value, { req }) => {
        const keys = Object.keys(req.body || {});
        if (keys.length === 0) {
            throw new Error('No se proporcionaron campos para actualizar.');
        }
        return true;
    }),
    validate
];

export {
    matrizaccesosGetValidation,
    idMatrizAccesoParamValidation,
    matrizaccesoBodyRequiredValidation,
    matrizaccesoBodyPatchValidation
};
