import DetalleUsuariosEncuestas from "../../models/encuestas/detalleusuariosencuestas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Helper: parsear entero positivo ─────────────────────────────────────────
const parsePositiveInt = (value) => {
    const n = parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_detalle_usuario_encuesta', 'id_usuario_encuesta', 'id_encuesta_pregunta_respuesta'
];
const DEFAULT_SORT_FIELD = 'id_detalle_usuario_encuesta';

// ─────────────────────────────────────────────────────────────────────────────
// GET /detalleusuariosencuestas  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const detalleusuariosencuestasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Filtros opcionales por clave foránea
        const where = {};
        const fkFilters = ['id_usuario_encuesta', 'id_encuesta_pregunta_respuesta'];
        for (const field of fkFilters) {
            if (req.query[field] !== undefined) {
                const val = parsePositiveInt(req.query[field]);
                if (val === null) {
                    return res.status(400).json({
                        success: false,
                        message: `El parámetro ${field} debe ser un entero positivo`
                    });
                }
                where[field] = val;
            }
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await DetalleUsuariosEncuestas.findAndCountAll({
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
        console.error('[detalleusuariosencuestasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /detalleusuariosencuestas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const detalleusuarioencuestaGetById = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        // Lectura simple: sin transacción explícita
        const registro = await DetalleUsuariosEncuestas.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Detalle de usuario en encuesta no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[detalleusuarioencuestaGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /detalleusuariosencuestas  →  crear nuevo detalle
// ─────────────────────────────────────────────────────────────────────────────
export const detalleusuarioencuestaPost = async (req, res, next) => {
    try {
        const { id_usuario_encuesta, id_encuesta_pregunta_respuesta } = req.body;

        // Ambos campos son obligatorios (allowNull: false en el modelo)
        const idUsuarioEncuesta            = parsePositiveInt(id_usuario_encuesta);
        const idEncuestaPreguntaRespuesta  = parsePositiveInt(id_encuesta_pregunta_respuesta);

        if (idUsuarioEncuesta === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_usuario_encuesta es obligatorio y debe ser un entero positivo'
            });
        }
        if (idEncuestaPreguntaRespuesta === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_encuesta_pregunta_respuesta es obligatorio y debe ser un entero positivo'
            });
        }

        // Verificar duplicado de la combinación clave
        const existe = await DetalleUsuariosEncuestas.findOne({
            where: {
                id_usuario_encuesta:           idUsuarioEncuesta,
                id_encuesta_pregunta_respuesta: idEncuestaPreguntaRespuesta
            }
        });
        if (existe) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un detalle con la misma combinación de usuario-encuesta y pregunta-respuesta'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await DetalleUsuariosEncuestas.create(
                {
                    id_usuario_encuesta:           idUsuarioEncuesta,
                    id_encuesta_pregunta_respuesta: idEncuestaPreguntaRespuesta
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Detalle de usuario en encuesta creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[detalleusuarioencuestaPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /detalleusuariosencuestas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const detalleusuarioencuestaPut = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { id_usuario_encuesta, id_encuesta_pregunta_respuesta } = req.body;

        // Ambos campos obligatorios en PUT
        const idUsuarioEncuesta           = parsePositiveInt(id_usuario_encuesta);
        const idEncuestaPreguntaRespuesta = parsePositiveInt(id_encuesta_pregunta_respuesta);

        if (idUsuarioEncuesta === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_usuario_encuesta es obligatorio y debe ser un entero positivo'
            });
        }
        if (idEncuestaPreguntaRespuesta === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_encuesta_pregunta_respuesta es obligatorio y debe ser un entero positivo'
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await DetalleUsuariosEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de la combinación clave (excluyendo el propio registro)
            const duplicado = await DetalleUsuariosEncuestas.findOne({
                where: {
                    id_usuario_encuesta:           idUsuarioEncuesta,
                    id_encuesta_pregunta_respuesta: idEncuestaPreguntaRespuesta,
                    id_detalle_usuario_encuesta:   { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe un detalle con la misma combinación de usuario-encuesta y pregunta-respuesta');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    id_usuario_encuesta:           idUsuarioEncuesta,
                    id_encuesta_pregunta_respuesta: idEncuestaPreguntaRespuesta
                },
                { transaction: t }
            );
            return await DetalleUsuariosEncuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Detalle de usuario en encuesta no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Detalle de usuario en encuesta actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[detalleusuarioencuestaPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /detalleusuariosencuestas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const detalleusuarioencuestaPatch = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const camposPermitidos = ['id_usuario_encuesta', 'id_encuesta_pregunta_respuesta'];
        const camposRecibidos  = Object.keys(req.body).filter(k => camposPermitidos.includes(k));

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Se requiere al menos uno de los campos: ${camposPermitidos.join(', ')}`
            });
        }

        // Construir objeto de cambios validados
        const cambios = {};

        if ('id_usuario_encuesta' in req.body) {
            const val = parsePositiveInt(req.body.id_usuario_encuesta);
            if (val === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_usuario_encuesta debe ser un entero positivo'
                });
            }
            cambios.id_usuario_encuesta = val;
        }
        if ('id_encuesta_pregunta_respuesta' in req.body) {
            const val = parsePositiveInt(req.body.id_encuesta_pregunta_respuesta);
            if (val === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_encuesta_pregunta_respuesta debe ser un entero positivo'
                });
            }
            cambios.id_encuesta_pregunta_respuesta = val;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await DetalleUsuariosEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Resolver valores finales de la clave compuesta
            const idUsuarioFinal  = 'id_usuario_encuesta'           in cambios
                ? cambios.id_usuario_encuesta
                : registro.id_usuario_encuesta;
            const idRespuestaFinal = 'id_encuesta_pregunta_respuesta' in cambios
                ? cambios.id_encuesta_pregunta_respuesta
                : registro.id_encuesta_pregunta_respuesta;

            // Verificar duplicado si cambia algún campo de la clave compuesta
            const cambiaClave =
                'id_usuario_encuesta'           in cambios ||
                'id_encuesta_pregunta_respuesta' in cambios;

            if (cambiaClave) {
                const duplicado = await DetalleUsuariosEncuestas.findOne({
                    where: {
                        id_usuario_encuesta:           idUsuarioFinal,
                        id_encuesta_pregunta_respuesta: idRespuestaFinal,
                        id_detalle_usuario_encuesta:   { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe un detalle con la misma combinación de usuario-encuesta y pregunta-respuesta');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await DetalleUsuariosEncuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Detalle de usuario en encuesta no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Detalle de usuario en encuesta actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('[detalleusuarioencuestaPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /detalleusuariosencuestas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const detalleusuarioencuestaDelete = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await DetalleUsuariosEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Detalle de usuario en encuesta no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Detalle de usuario en encuesta eliminado correctamente',
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
                message: 'No se puede eliminar: el detalle está referenciado en otras tablas'
            });
        }
        console.error('[detalleusuarioencuestaDelete]', error.message || error);
        return next(error);
    }
};
