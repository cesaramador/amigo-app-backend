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
// const MAX_GRAVEDAD           = 100;
// const MAX_ACCIONES_PROPUESTAS = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /interpretacionresultados  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const interpretacionresultadosGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
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
            where.id_encuesta = req.query.id_encuesta;
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
export const interpretacionresultadoGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

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
export const interpretacionresultadoPost = async (req, res, next) => {
    try {
        const { id_encuesta, puntuacion, gravedad, acciones_propuestas } = req.body;
        const idEnc = id_encuesta;
        const punt = puntuacion;
        const gravedadVal = gravedad.trim();
        const accionesVal = acciones_propuestas.trim();

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
export const interpretacionresultadoPut = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { id_encuesta, puntuacion, gravedad, acciones_propuestas } = req.body;
        const idEnc = id_encuesta;
        const punt = puntuacion;
        const gravedadVal = gravedad.trim();
        const accionesVal = acciones_propuestas.trim();

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
export const interpretacionresultadoPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { id_encuesta, puntuacion, gravedad, acciones_propuestas } = req.body;

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (id_encuesta !== undefined) {
            updates.id_encuesta = id_encuesta;
        }

        if (puntuacion !== undefined) {
            updates.puntuacion = puntuacion;
        }

        if (gravedad !== undefined) {
            const gravedadVal = gravedad.trim();
            updates.gravedad = gravedadVal;
        }

        if (acciones_propuestas !== undefined) {
            const accionesVal = acciones_propuestas.trim();
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
export const interpretacionresultadoDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

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
