import { body, param, query, validationResult } from 'express-validator';

const sortableFields = ['id_inscripciongrupo', 'id_periodo_grupo', 'id_usuario_inscrito'];
const writeFields = ['id_periodo_grupo', 'id_usuario_inscrito'];

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

const idInscripcionGrupoParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalido: debe ser un entero positivo')
        .toInt(),
    validate
];

const inscripcionesGruposGetValidation = [
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
    query('id_periodo_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_periodo_grupo debe ser un entero positivo')
        .toInt(),
    query('id_usuario_inscrito')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El parametro id_usuario_inscrito debe ser un entero positivo')
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
    body('id_periodo_grupo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_periodo_grupo debe ser un entero positivo')
        .toInt(),
    body('id_usuario_inscrito')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El campo id_usuario_inscrito debe ser un entero positivo')
        .toInt()
];

const inscripcionesGrupoPostValidation = [
    ...sharedBodyRules,
    body('id_periodo_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_periodo_grupo es obligatorio y debe ser un entero positivo'),
    body('id_usuario_inscrito')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_usuario_inscrito es obligatorio y debe ser un entero positivo'),
    validate
];

const inscripcionesGrupoPutValidation = [
    ...sharedBodyRules,
    body('id_periodo_grupo')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_periodo_grupo es obligatorio y debe ser un entero positivo'),
    body('id_usuario_inscrito')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('El campo id_usuario_inscrito es obligatorio y debe ser un entero positivo'),
    validate
];

const inscripcionesGrupoPatchValidation = [
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
    inscripcionesGruposGetValidation,
    idInscripcionGrupoParamValidation,
    inscripcionesGrupoPostValidation,
    inscripcionesGrupoPutValidation,
    inscripcionesGrupoPatchValidation
};
