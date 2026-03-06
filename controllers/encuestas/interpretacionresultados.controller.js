import InterpretacionResultados from "../../models/encuestas/interpretacionresultados.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_interpreta_resultado',
    'id_encuesta',
    'puntuacion',
    'gravedad',
    'acciones_propuestas'
];
const DEFAULT_SORT_FIELD = 'id_interpreta_resultado';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
const MAX_GRAVEDAD           = 100;
const MAX_ACCIONES_PROPUESTAS = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /interpretacionresultados  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo gravedad o acciones_propuestas
        const q     = (req.query.q || '').trim();
        const where = q
            ? {
                [Op.or]: [
                    { gravedad:           { [Op.like]: `%${q}%` } },
                    { acciones_propuestas: { [Op.like]: `%${q}%` } }
                ]
              }
            : {};

        // Filtro opcional por id_encuesta
        if (req.query.id_encuesta) {
            const idEnc = parseInt(req.query.id_encuesta, 10);
            if (!Number.isInteger(idEnc) || idEnc <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro id_encuesta debe ser un entero positivo'
                });
            }
            where.id_encuesta = idEnc;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const { count, rows } = await InterpretacionResultados.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortFieldSafe, sortOrder]]
        });

        const total = count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: rows
        });
    } catch (error) {
        console.error('[interpretacionresultadosGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /interpretacionresultados/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const registro = await InterpretacionResultados.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Interpretación de resultado no encontrada'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[interpretacionresultadosGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /interpretacionresultados  →  crear nuevo registro
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosPost = async (req, res, next) => {
    try {
        const { id_encuesta, puntuacion, gravedad, acciones_propuestas } = req.body;

        // ── Validaciones de campos obligatorios ──────────────────────────────

        // id_encuesta
        const idEnc = parseInt(id_encuesta, 10);
        if (!Number.isInteger(idEnc) || idEnc <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_encuesta debe ser un entero positivo'
            });
        }

        // puntuacion
        const punt = parseInt(puntuacion, 10);
        if (!Number.isInteger(punt)) {
            return res.status(400).json({
                success: false,
                message: 'El campo puntuacion debe ser un número entero'
            });
        }

        // gravedad
        if (!gravedad || typeof gravedad !== 'string' || gravedad.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo gravedad es obligatorio'
            });
        }
        const gravedadVal = gravedad.trim();
        if (gravedadVal.length > MAX_GRAVEDAD) {
            return res.status(400).json({
                success: false,
                message: `El campo gravedad no puede exceder ${MAX_GRAVEDAD} caracteres`
            });
        }

        // acciones_propuestas
        if (!acciones_propuestas || typeof acciones_propuestas !== 'string' || acciones_propuestas.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo acciones_propuestas es obligatorio'
            });
        }
        const accionesVal = acciones_propuestas.trim();
        if (accionesVal.length > MAX_ACCIONES_PROPUESTAS) {
            return res.status(400).json({
                success: false,
                message: `El campo acciones_propuestas no puede exceder ${MAX_ACCIONES_PROPUESTAS} caracteres`
            });
        }

        // Verificar duplicado: misma encuesta + misma puntuacion
        const exists = await InterpretacionResultados.findOne({
            where: { id_encuesta: idEnc, puntuacion: punt }
        });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una interpretación de resultado con esa encuesta y puntuación'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await InterpretacionResultados.create(
                {
                    id_encuesta:          idEnc,
                    puntuacion:           punt,
                    gravedad:             gravedadVal,
                    acciones_propuestas:  accionesVal
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Interpretación de resultado creada exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[interpretacionresultadosPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /interpretacionresultados/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { id_encuesta, puntuacion, gravedad, acciones_propuestas } = req.body;

        // ── Validaciones ─────────────────────────────────────────────────────

        const idEnc = parseInt(id_encuesta, 10);
        if (!Number.isInteger(idEnc) || idEnc <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_encuesta debe ser un entero positivo'
            });
        }

        const punt = parseInt(puntuacion, 10);
        if (!Number.isInteger(punt)) {
            return res.status(400).json({
                success: false,
                message: 'El campo puntuacion debe ser un número entero'
            });
        }

        if (!gravedad || typeof gravedad !== 'string' || gravedad.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo gravedad es obligatorio'
            });
        }
        const gravedadVal = gravedad.trim();
        if (gravedadVal.length > MAX_GRAVEDAD) {
            return res.status(400).json({
                success: false,
                message: `El campo gravedad no puede exceder ${MAX_GRAVEDAD} caracteres`
            });
        }

        if (!acciones_propuestas || typeof acciones_propuestas !== 'string' || acciones_propuestas.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo acciones_propuestas es obligatorio'
            });
        }
        const accionesVal = acciones_propuestas.trim();
        if (accionesVal.length > MAX_ACCIONES_PROPUESTAS) {
            return res.status(400).json({
                success: false,
                message: `El campo acciones_propuestas no puede exceder ${MAX_ACCIONES_PROPUESTAS} caracteres`
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await InterpretacionResultados.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            const duplicado = await InterpretacionResultados.findOne({
                where: {
                    id_encuesta: idEnc,
                    puntuacion:  punt,
                    id_interpreta_resultado: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe una interpretación de resultado con esa encuesta y puntuación');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    id_encuesta:         idEnc,
                    puntuacion:          punt,
                    gravedad:            gravedadVal,
                    acciones_propuestas: accionesVal
                },
                { transaction: t }
            );
            return await InterpretacionResultados.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Interpretación de resultado no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Interpretación de resultado actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[interpretacionresultadosPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /interpretacionresultados/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { id_encuesta, puntuacion, gravedad, acciones_propuestas } = req.body;

        // Al menos un campo debe venir en el body
        if (
            id_encuesta        === undefined &&
            puntuacion         === undefined &&
            gravedad           === undefined &&
            acciones_propuestas === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar: id_encuesta, puntuacion, gravedad, acciones_propuestas'
            });
        }

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (id_encuesta !== undefined) {
            const idEnc = parseInt(id_encuesta, 10);
            if (!Number.isInteger(idEnc) || idEnc <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_encuesta debe ser un entero positivo'
                });
            }
            updates.id_encuesta = idEnc;
        }

        if (puntuacion !== undefined) {
            const punt = parseInt(puntuacion, 10);
            if (!Number.isInteger(punt)) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo puntuacion debe ser un número entero'
                });
            }
            updates.puntuacion = punt;
        }

        if (gravedad !== undefined) {
            if (typeof gravedad !== 'string' || gravedad.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El campo gravedad no es válido'
                });
            }
            const gravedadVal = gravedad.trim();
            if (gravedadVal.length > MAX_GRAVEDAD) {
                return res.status(400).json({
                    success: false,
                    message: `El campo gravedad no puede exceder ${MAX_GRAVEDAD} caracteres`
                });
            }
            updates.gravedad = gravedadVal;
        }

        if (acciones_propuestas !== undefined) {
            if (typeof acciones_propuestas !== 'string' || acciones_propuestas.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El campo acciones_propuestas no es válido'
                });
            }
            const accionesVal = acciones_propuestas.trim();
            if (accionesVal.length > MAX_ACCIONES_PROPUESTAS) {
                return res.status(400).json({
                    success: false,
                    message: `El campo acciones_propuestas no puede exceder ${MAX_ACCIONES_PROPUESTAS} caracteres`
                });
            }
            updates.acciones_propuestas = accionesVal;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await InterpretacionResultados.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Si se están actualizando id_encuesta o puntuacion, verificar duplicado
            const encuestaFinal   = updates.id_encuesta ?? registro.id_encuesta;
            const puntuacionFinal = updates.puntuacion   ?? registro.puntuacion;

            if (updates.id_encuesta !== undefined || updates.puntuacion !== undefined) {
                const duplicado = await InterpretacionResultados.findOne({
                    where: {
                        id_encuesta: encuestaFinal,
                        puntuacion:  puntuacionFinal,
                        id_interpreta_resultado: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una interpretación de resultado con esa encuesta y puntuación');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(updates, { transaction: t });
            return await InterpretacionResultados.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Interpretación de resultado no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Interpretación de resultado actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[interpretacionresultadosPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /interpretacionresultados/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await InterpretacionResultados.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Interpretación de resultado no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Interpretación de resultado eliminada correctamente',
            data: eliminado
        });
    } catch (error) {
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: la interpretación de resultado está referenciada en otras tablas'
            });
        }
        console.error('[interpretacionresultadosDelete]', error.message || error);
        return next(error);
    }
};
