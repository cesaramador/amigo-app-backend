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
const MAX_RESPUESTA = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /respuestas  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const respuestasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo respuesta
        const q     = (req.query.q || '').trim();
        const where = q ? { respuesta: { [Op.like]: `%${q}%` } } : {};

        // Filtro opcional por id_estatus_enc_preg_resp
        if (req.query.id_estatus_enc_preg_resp !== undefined) {
            const idEst = parseInt(req.query.id_estatus_enc_preg_resp, 10);
            if (!Number.isInteger(idEst) || idEst <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro id_estatus_enc_preg_resp debe ser un entero positivo'
                });
            }
            where.id_estatus_enc_preg_resp = idEst;
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
export const respuestasGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

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
export const respuestasPost = async (req, res, next) => {
    try {
        const { respuesta, id_estatus_enc_preg_resp } = req.body;

        // ── Validación: respuesta ────────────────────────────────────────────
        if (!respuesta || typeof respuesta !== 'string' || respuesta.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo respuesta es obligatorio'
            });
        }
        const respuestaVal = respuesta.trim();
        if (respuestaVal.length > MAX_RESPUESTA) {
            return res.status(400).json({
                success: false,
                message: `El campo respuesta no puede exceder ${MAX_RESPUESTA} caracteres`
            });
        }

        // ── Validación: id_estatus_enc_preg_resp ─────────────────────────────
        const idEst = parseInt(id_estatus_enc_preg_resp, 10);
        if (!Number.isInteger(idEst) || idEst <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_estatus_enc_preg_resp debe ser un entero positivo'
            });
        }

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
export const respuestasPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { respuesta, id_estatus_enc_preg_resp } = req.body;

        // ── Validación: respuesta ────────────────────────────────────────────
        if (!respuesta || typeof respuesta !== 'string' || respuesta.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo respuesta es obligatorio'
            });
        }
        const respuestaVal = respuesta.trim();
        if (respuestaVal.length > MAX_RESPUESTA) {
            return res.status(400).json({
                success: false,
                message: `El campo respuesta no puede exceder ${MAX_RESPUESTA} caracteres`
            });
        }

        // ── Validación: id_estatus_enc_preg_resp ─────────────────────────────
        const idEst = parseInt(id_estatus_enc_preg_resp, 10);
        if (!Number.isInteger(idEst) || idEst <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_estatus_enc_preg_resp debe ser un entero positivo'
            });
        }

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
export const respuestasPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { respuesta, id_estatus_enc_preg_resp } = req.body;

        // Al menos un campo debe venir en el body
        if (respuesta === undefined && id_estatus_enc_preg_resp === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar: respuesta, id_estatus_enc_preg_resp'
            });
        }

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (respuesta !== undefined) {
            if (typeof respuesta !== 'string' || respuesta.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El campo respuesta no es válido'
                });
            }
            const respuestaVal = respuesta.trim();
            if (respuestaVal.length > MAX_RESPUESTA) {
                return res.status(400).json({
                    success: false,
                    message: `El campo respuesta no puede exceder ${MAX_RESPUESTA} caracteres`
                });
            }
            updates.respuesta = respuestaVal;
        }

        if (id_estatus_enc_preg_resp !== undefined) {
            const idEst = parseInt(id_estatus_enc_preg_resp, 10);
            if (!Number.isInteger(idEst) || idEst <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_estatus_enc_preg_resp debe ser un entero positivo'
                });
            }
            updates.id_estatus_enc_preg_resp = idEst;
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
export const respuestasDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

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
