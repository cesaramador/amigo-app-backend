import Preguntas from "../../models/encuestas/preguntas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_pregunta',
    'pregunta',
    'id_estatus_enc_preg_resp'
];
const DEFAULT_SORT_FIELD = 'id_pregunta';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
const MAX_PREGUNTA = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /preguntas  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const preguntasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo pregunta
        const q     = (req.query.q || '').trim();
        const where = q ? { pregunta: { [Op.like]: `%${q}%` } } : {};

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
        const { count, rows } = await Preguntas.findAndCountAll({
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
        console.error('[preguntasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /preguntas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const preguntasGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        // Lectura simple: sin transacción explícita
        const registro = await Preguntas.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Pregunta no encontrada'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[preguntasGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /preguntas  →  crear nueva pregunta
// ─────────────────────────────────────────────────────────────────────────────
export const preguntasPost = async (req, res, next) => {
    try {
        const { pregunta, id_estatus_enc_preg_resp } = req.body;

        // ── Validación: pregunta ─────────────────────────────────────────────
        if (!pregunta || typeof pregunta !== 'string' || pregunta.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo pregunta es obligatorio'
            });
        }
        const preguntaVal = pregunta.trim();
        if (preguntaVal.length > MAX_PREGUNTA) {
            return res.status(400).json({
                success: false,
                message: `El campo pregunta no puede exceder ${MAX_PREGUNTA} caracteres`
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

        // Verificar duplicado: misma pregunta con el mismo estatus
        const exists = await Preguntas.findOne({ where: { pregunta: preguntaVal } });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una pregunta con ese texto'
            });
        }

        // Crear dentro de transacción
        const nueva = await sequelize.transaction(async (t) => {
            return await Preguntas.create(
                {
                    pregunta:                preguntaVal,
                    id_estatus_enc_preg_resp: idEst
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Pregunta creada exitosamente',
            data: nueva
        });
    } catch (error) {
        console.error('[preguntasPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /preguntas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const preguntasPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { pregunta, id_estatus_enc_preg_resp } = req.body;

        // ── Validación: pregunta ─────────────────────────────────────────────
        if (!pregunta || typeof pregunta !== 'string' || pregunta.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo pregunta es obligatorio'
            });
        }
        const preguntaVal = pregunta.trim();
        if (preguntaVal.length > MAX_PREGUNTA) {
            return res.status(400).json({
                success: false,
                message: `El campo pregunta no puede exceder ${MAX_PREGUNTA} caracteres`
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
            const registro = await Preguntas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de texto (excluir el propio registro)
            const duplicado = await Preguntas.findOne({
                where: {
                    pregunta:    preguntaVal,
                    id_pregunta: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe una pregunta con ese texto');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    pregunta:                preguntaVal,
                    id_estatus_enc_preg_resp: idEst
                },
                { transaction: t }
            );
            return await Preguntas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Pregunta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pregunta actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[preguntasPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /preguntas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const preguntasPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { pregunta, id_estatus_enc_preg_resp } = req.body;

        // Al menos un campo debe venir en el body
        if (pregunta === undefined && id_estatus_enc_preg_resp === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar: pregunta, id_estatus_enc_preg_resp'
            });
        }

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (pregunta !== undefined) {
            if (typeof pregunta !== 'string' || pregunta.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El campo pregunta no es válido'
                });
            }
            const preguntaVal = pregunta.trim();
            if (preguntaVal.length > MAX_PREGUNTA) {
                return res.status(400).json({
                    success: false,
                    message: `El campo pregunta no puede exceder ${MAX_PREGUNTA} caracteres`
                });
            }
            updates.pregunta = preguntaVal;
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
            const registro = await Preguntas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Solo verificar duplicado si el texto de la pregunta cambia
            if (updates.pregunta !== undefined && updates.pregunta !== registro.pregunta) {
                const duplicado = await Preguntas.findOne({
                    where: {
                        pregunta:    updates.pregunta,
                        id_pregunta: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una pregunta con ese texto');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(updates, { transaction: t });
            return await Preguntas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Pregunta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pregunta actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[preguntasPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /preguntas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const preguntasDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Preguntas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Pregunta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pregunta eliminada correctamente',
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
                message: 'No se puede eliminar: la pregunta está referenciada en otras tablas'
            });
        }
        console.error('[preguntasDelete]', error.message || error);
        return next(error);
    }
};
