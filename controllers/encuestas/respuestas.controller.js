import Respuestas from "../../models/encuestas/respuestas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_respuesta',
    'respuesta',
    'id_estatus_enc_preg_resp'
];
const DEFAULT_SORT_FIELD = 'id_respuesta';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
// const MAX_RESPUESTA = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /respuestas  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const respuestasGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo respuesta
        const q     = (req.query.q || '').trim();
        const where = q ? { respuesta: { [Op.like]: `%${q}%` } } : {};

        // Filtro opcional por id_estatus_enc_preg_resp
        if (req.query.id_estatus_enc_preg_resp !== undefined) {
            where.id_estatus_enc_preg_resp = req.query.id_estatus_enc_preg_resp;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await Respuestas.findAndCountAll({
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
        console.error('[respuestasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /respuestas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const respuestaGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const registro = await Respuestas.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[respuestasGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /respuestas  →  crear nueva respuesta
// ─────────────────────────────────────────────────────────────────────────────
export const respuestaPost = async (req, res, next) => {
    try {
        const { respuesta, id_estatus_enc_preg_resp } = req.body;
        const respuestaVal = respuesta.trim();
        const idEst = id_estatus_enc_preg_resp;

        // Verificar duplicado: misma respuesta
        const exists = await Respuestas.findOne({ where: { respuesta: respuestaVal } });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una respuesta con ese texto'
            });
        }

        // Crear dentro de transacción
        const nueva = await sequelize.transaction(async (t) => {
            return await Respuestas.create(
                {
                    respuesta:               respuestaVal,
                    id_estatus_enc_preg_resp: idEst
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Respuesta creada exitosamente',
            data: nueva
        });
    } catch (error) {
        console.error('[respuestasPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /respuestas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const respuestaPut = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { respuesta, id_estatus_enc_preg_resp } = req.body;
        const respuestaVal = respuesta.trim();
        const idEst = id_estatus_enc_preg_resp;

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Respuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de texto (excluir el propio registro)
            const duplicado = await Respuestas.findOne({
                where: {
                    respuesta:    respuestaVal,
                    id_respuesta: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe una respuesta con ese texto');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    respuesta:               respuestaVal,
                    id_estatus_enc_preg_resp: idEst
                },
                { transaction: t }
            );
            return await Respuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Respuesta actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[respuestasPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /respuestas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const respuestaPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { respuesta, id_estatus_enc_preg_resp } = req.body;

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (respuesta !== undefined) {
            const respuestaVal = respuesta.trim();
            updates.respuesta = respuestaVal;
        }

        if (id_estatus_enc_preg_resp !== undefined) {
            updates.id_estatus_enc_preg_resp = id_estatus_enc_preg_resp;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Respuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Solo verificar duplicado si el texto de la respuesta cambia
            if (updates.respuesta !== undefined && updates.respuesta !== registro.respuesta) {
                const duplicado = await Respuestas.findOne({
                    where: {
                        respuesta:    updates.respuesta,
                        id_respuesta: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una respuesta con ese texto');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(updates, { transaction: t });
            return await Respuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Respuesta actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[respuestasPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /respuestas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const respuestaDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Respuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Respuesta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Respuesta eliminada correctamente',
            data: eliminado
        });
    } catch (error) {
        // Integridad referencial
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: la respuesta está referenciada en otras tablas'
            });
        }
        console.error('[respuestasDelete]', error.message || error);
        return next(error);
    }
};
