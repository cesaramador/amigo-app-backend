import Asistencias from "../../models/grupos/asistencias.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_asistencia', 'id_inscripciongrupo', 'fecha', 'asistencia'];
const DEFAULT_SORT_FIELD  = 'id_asistencia';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convierte un valor a booleano estricto.
 * Acepta: true/false (bool), "true"/"false"/"1"/"0" (string).
 * Devuelve null si el valor no es reconocible.
 */
const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true'  || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /asistencias  →  lista paginada con filtro y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const asistenciasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Filtros opcionales
        const where = {};

        // Filtrar por id_inscripciongrupo
        if (req.query.id_inscripciongrupo !== undefined) {
            const idIg = parseInt(req.query.id_inscripciongrupo, 10);
            if (!Number.isInteger(idIg) || idIg <= 0) {
                return res.status(400).json({ success: false, message: 'El parámetro id_inscripciongrupo debe ser un entero positivo' });
            }
            where.id_inscripciongrupo = idIg;
        }

        // Filtrar por fecha (rango: fecha_desde / fecha_hasta)
        const rangoFecha = {};
        if (req.query.fecha_desde) {
            const d = new Date(req.query.fecha_desde);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ success: false, message: 'El parámetro fecha_desde no es una fecha válida' });
            }
            rangoFecha[Op.gte] = d;
        }
        if (req.query.fecha_hasta) {
            const d = new Date(req.query.fecha_hasta);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ success: false, message: 'El parámetro fecha_hasta no es una fecha válida' });
            }
            rangoFecha[Op.lte] = d;
        }
        if (Object.keys(rangoFecha).length) where.fecha = rangoFecha;

        // Filtrar por asistencia (true/false)
        if (req.query.asistencia !== undefined) {
            const boolVal = parseBoolean(req.query.asistencia);
            if (boolVal === null) {
                return res.status(400).json({ success: false, message: 'El parámetro asistencia debe ser true o false' });
            }
            where.asistencia = boolVal;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta paginada
        const { count, rows } = await Asistencias.findAndCountAll({
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
        console.error('[asistenciasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /asistencias/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const asistenciaGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const registro = await Asistencias.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Asistencia no encontrada' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[asistenciaGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /asistencias  →  crear nueva asistencia
// ─────────────────────────────────────────────────────────────────────────────
export const asistenciaPost = async (req, res, next) => {
    try {
        const { id_inscripciongrupo, fecha, asistencia } = req.body;

        // Validar id_inscripciongrupo
        const idIg = parseInt(id_inscripciongrupo, 10);
        if (!Number.isInteger(idIg) || idIg <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_inscripciongrupo es obligatorio y debe ser un entero positivo' });
        }

        // Validar fecha
        if (!fecha) {
            return res.status(400).json({ success: false, message: 'El campo fecha es obligatorio' });
        }
        const fechaDate = new Date(fecha);
        if (isNaN(fechaDate.getTime())) {
            return res.status(400).json({ success: false, message: 'El campo fecha no es una fecha válida' });
        }

        // Validar asistencia (booleano)
        const boolAsistencia = parseBoolean(asistencia);
        if (boolAsistencia === null) {
            return res.status(400).json({ success: false, message: 'El campo asistencia es obligatorio y debe ser true o false' });
        }

        // Evitar registro duplicado (mismo inscripciongrupo + misma fecha)
        const existente = await Asistencias.findOne({
            where: { id_inscripciongrupo: idIg, fecha: fechaDate }
        });
        if (existente) {
            return res.status(409).json({ success: false, message: 'Ya existe una asistencia registrada para esta inscripción en la fecha indicada' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Asistencias.create(
                { id_inscripciongrupo: idIg, fecha: fechaDate, asistencia: boolAsistencia },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Asistencia registrada exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[asistenciaPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /asistencias/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const asistenciaPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { id_inscripciongrupo, fecha, asistencia } = req.body;

        // Validar id_inscripciongrupo
        const idIg = parseInt(id_inscripciongrupo, 10);
        if (!Number.isInteger(idIg) || idIg <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_inscripciongrupo es obligatorio y debe ser un entero positivo' });
        }

        // Validar fecha
        if (!fecha) {
            return res.status(400).json({ success: false, message: 'El campo fecha es obligatorio' });
        }
        const fechaDate = new Date(fecha);
        if (isNaN(fechaDate.getTime())) {
            return res.status(400).json({ success: false, message: 'El campo fecha no es una fecha válida' });
        }

        // Validar asistencia
        const boolAsistencia = parseBoolean(asistencia);
        if (boolAsistencia === null) {
            return res.status(400).json({ success: false, message: 'El campo asistencia es obligatorio y debe ser true o false' });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Asistencias.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (misma inscripción + misma fecha, excluyendo el propio registro)
            const duplicado = await Asistencias.findOne({
                where: {
                    id_inscripciongrupo: idIg,
                    fecha: fechaDate,
                    id_asistencia: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe una asistencia registrada para esta inscripción en la fecha indicada');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                { id_inscripciongrupo: idIg, fecha: fechaDate, asistencia: boolAsistencia },
                { transaction: t }
            );
            return await Asistencias.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Asistencia no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Asistencia actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[asistenciaPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /asistencias/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const asistenciaPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const camposPermitidos = ['id_inscripciongrupo', 'fecha', 'asistencia'];
        const camposRecibidos  = Object.keys(req.body).filter(k => camposPermitidos.includes(k));

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Se requiere al menos uno de los campos: ${camposPermitidos.join(', ')}`
            });
        }

        // Construir objeto de cambios validados
        const cambios = {};

        if ('id_inscripciongrupo' in req.body) {
            const idIg = parseInt(req.body.id_inscripciongrupo, 10);
            if (!Number.isInteger(idIg) || idIg <= 0) {
                return res.status(400).json({ success: false, message: 'El campo id_inscripciongrupo debe ser un entero positivo' });
            }
            cambios.id_inscripciongrupo = idIg;
        }

        if ('fecha' in req.body) {
            const fechaDate = new Date(req.body.fecha);
            if (isNaN(fechaDate.getTime())) {
                return res.status(400).json({ success: false, message: 'El campo fecha no es una fecha válida' });
            }
            cambios.fecha = fechaDate;
        }

        if ('asistencia' in req.body) {
            const boolAsistencia = parseBoolean(req.body.asistencia);
            if (boolAsistencia === null) {
                return res.status(400).json({ success: false, message: 'El campo asistencia debe ser true o false' });
            }
            cambios.asistencia = boolAsistencia;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Asistencias.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Si se está modificando id_inscripciongrupo o fecha, verificar duplicado
            const idIgFinal    = cambios.id_inscripciongrupo ?? registro.id_inscripciongrupo;
            const fechaFinal   = cambios.fecha               ?? registro.fecha;
            const hayDuplClave = 'id_inscripciongrupo' in cambios || 'fecha' in cambios;

            if (hayDuplClave) {
                const duplicado = await Asistencias.findOne({
                    where: {
                        id_inscripciongrupo: idIgFinal,
                        fecha: fechaFinal,
                        id_asistencia: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una asistencia registrada para esta inscripción en la fecha indicada');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await Asistencias.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Asistencia no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Asistencia actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[asistenciaPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /asistencias/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const asistenciaDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Asistencias.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Asistencia no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Asistencia eliminada correctamente',
            data: eliminado
        });
    } catch (error) {
        // Manejo de integridad referencial
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: la asistencia está referenciada en otras tablas'
            });
        }
        console.error('[asistenciaDelete]', error.message || error);
        return next(error);
    }
};
