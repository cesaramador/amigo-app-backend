import EncuestasPreguntasRespuestas from "../../models/encuestas/encuestaspreguntasrespuestas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_encuesta_pregunta_respuesta', 'id_encuesta', 'id_pregunta', 'id_respuesta'
];
const DEFAULT_SORT_FIELD = 'id_encuesta_pregunta_respuesta';

// ─────────────────────────────────────────────────────────────────────────────
// GET /encuestaspreguntasrespuestas  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const encuestaspreguntasrespuestasGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Filtros opcionales por clave foránea
        const where = {};
        const fkFilters = ['id_encuesta', 'id_pregunta', 'id_respuesta'];
        for (const field of fkFilters) {
            if (req.query[field] !== undefined) {
                where[field] = req.query[field];
            }
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await EncuestasPreguntasRespuestas.findAndCountAll({
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
        console.error('[encuestaspreguntasrespuestasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /encuestaspreguntasrespuestas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const encuestapreguntarespuestaGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const registro = await EncuestasPreguntasRespuestas.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Relación encuesta-pregunta-respuesta no encontrada' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[encuestapreguntarespuestaGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /encuestaspreguntasrespuestas  →  crear nuevo registro
// ─────────────────────────────────────────────────────────────────────────────
export const encuestapreguntarespuestaPost = async (req, res, next) => {
    try {
        const { id_encuesta, id_pregunta, id_respuesta } = req.body;
        const idEncuesta  = id_encuesta;
        const idPregunta  = id_pregunta;
        const idRespuesta = id_respuesta;

        // Verificar duplicado de la combinación ternaria
        const existe = await EncuestasPreguntasRespuestas.findOne({
            where: {
                id_encuesta:  idEncuesta,
                id_pregunta:  idPregunta,
                id_respuesta: idRespuesta
            }
        });
        if (existe) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una relación con la misma combinación de encuesta, pregunta y respuesta'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await EncuestasPreguntasRespuestas.create(
                { id_encuesta: idEncuesta, id_pregunta: idPregunta, id_respuesta: idRespuesta },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Relación encuesta-pregunta-respuesta creada exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[encuestapreguntarespuestaPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /encuestaspreguntasrespuestas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const encuestapreguntarespuestaPut = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { id_encuesta, id_pregunta, id_respuesta } = req.body;
        const idEncuesta  = id_encuesta;
        const idPregunta  = id_pregunta;
        const idRespuesta = id_respuesta;

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await EncuestasPreguntasRespuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de la combinación ternaria (excluyendo el propio registro)
            const duplicado = await EncuestasPreguntasRespuestas.findOne({
                where: {
                    id_encuesta:  idEncuesta,
                    id_pregunta:  idPregunta,
                    id_respuesta: idRespuesta,
                    id_encuesta_pregunta_respuesta: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe una relación con la misma combinación de encuesta, pregunta y respuesta');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                { id_encuesta: idEncuesta, id_pregunta: idPregunta, id_respuesta: idRespuesta },
                { transaction: t }
            );
            return await EncuestasPreguntasRespuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Relación encuesta-pregunta-respuesta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Relación encuesta-pregunta-respuesta actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[encuestapreguntarespuestaPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /encuestaspreguntasrespuestas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const encuestapreguntarespuestaPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const camposPermitidos = ['id_encuesta', 'id_pregunta', 'id_respuesta'];
        // const camposRecibidos  = Object.keys(req.body).filter(k => camposPermitidos.includes(k));

        // Construir objeto de cambios validados
        const cambios = {};
        for (const field of camposPermitidos) {
            if (field in req.body) {
                cambios[field] = req.body[field];
            }
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await EncuestasPreguntasRespuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Resolver valores finales de la clave ternaria para el check de duplicado
            const idEncuestaFinal  = 'id_encuesta'  in cambios ? cambios.id_encuesta  : registro.id_encuesta;
            const idPreguntaFinal  = 'id_pregunta'  in cambios ? cambios.id_pregunta  : registro.id_pregunta;
            const idRespuestaFinal = 'id_respuesta' in cambios ? cambios.id_respuesta : registro.id_respuesta;

            // Verificar duplicado solo si cambia algún campo de la clave
            const cambiaClave =
                'id_encuesta'  in cambios ||
                'id_pregunta'  in cambios ||
                'id_respuesta' in cambios;

            if (cambiaClave) {
                const duplicado = await EncuestasPreguntasRespuestas.findOne({
                    where: {
                        id_encuesta:  idEncuestaFinal,
                        id_pregunta:  idPreguntaFinal,
                        id_respuesta: idRespuestaFinal,
                        id_encuesta_pregunta_respuesta: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una relación con la misma combinación de encuesta, pregunta y respuesta');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await EncuestasPreguntasRespuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Relación encuesta-pregunta-respuesta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Relación encuesta-pregunta-respuesta actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('[encuestapreguntarespuestaPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /encuestaspreguntasrespuestas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const encuestapreguntarespuestaDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await EncuestasPreguntasRespuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Relación encuesta-pregunta-respuesta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Relación encuesta-pregunta-respuesta eliminada correctamente',
            data: eliminado
        });
    } catch (error) {
        // Integridad referencial — referenciado desde DetalleUsuariosEncuestas
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: la relación está referenciada en otras tablas'
            });
        }
        console.error('[encuestapreguntarespuestaDelete]', error.message || error);
        return next(error);
    }
};
