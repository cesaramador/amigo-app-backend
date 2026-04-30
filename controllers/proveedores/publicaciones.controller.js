import Publicaciones from "../../models/proveedores/publicaciones.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_publicacion',
    'id_proveedorconservicio',
    'fecha_registro_publicacion',
    'fecha_inicio_publicacion',
    'fecha_fin_publicacion',
    'id_estatus_publicacion'
];
const DEFAULT_SORT_FIELD = 'id_publicacion';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
// const MAX_IMAGEN = 800;

// ─── Utilidad: valida que un valor sea una fecha parseable ────────────────────
// const isValidDate = (value) => {
//    if (!value) return false;
//    const d = new Date(value);
//    return !isNaN(d.getTime());
//};

// ─────────────────────────────────────────────────────────────────────────────
// GET /publicaciones  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const publicacionesGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const where = {};

        // Filtro opcional por id_proveedorconservicio
        if (req.query.id_proveedorconservicio !== undefined) {
            where.id_proveedorconservicio = parseInt(req.query.id_proveedorconservicio, 10);
        }

        // Filtro opcional por id_estatus_publicacion
        if (req.query.id_estatus_publicacion !== undefined) {
            where.id_estatus_publicacion = parseInt(req.query.id_estatus_publicacion, 10);
        }

        // Filtro opcional por rango de fecha de inicio de publicación
        if (req.query.fecha_desde || req.query.fecha_hasta) {
            const rangoFecha = {};
            if (req.query.fecha_desde) {
                rangoFecha[Op.gte] = new Date(req.query.fecha_desde);
            }
            if (req.query.fecha_hasta) {
                rangoFecha[Op.lte] = new Date(req.query.fecha_hasta);
            }
            where.fecha_inicio_publicacion = rangoFecha;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await Publicaciones.findAndCountAll({
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
        console.error('[publicacionesGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /publicaciones/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const publicacionGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Lectura simple: sin transacción explícita
        const registro = await Publicaciones.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[publicacionesGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /publicaciones  →  crear nueva publicación
// ─────────────────────────────────────────────────────────────────────────────
export const publicacionPost = async (req, res, next) => {
    try {
        const {
            id_proveedorconservicio,
            imagen,
            fecha_registro_publicacion,
            fecha_inicio_publicacion,
            fecha_fin_publicacion,
            id_estatus_publicacion
        } = req.body;

        // const idPCS = parseInt(id_proveedorconservicio, 10);
        const imagenVal = imagen.trim();

        const fechaInicio = new Date(fecha_inicio_publicacion);
        const fechaFin    = new Date(fecha_fin_publicacion);
        const idEst = parseInt(id_estatus_publicacion, 10);

        // Crear dentro de transacción
        const nueva = await sequelize.transaction(async (t) => {
            return await Publicaciones.create(
                {
                    id_proveedorconservicio,
                    imagen:                    imagenVal,
                    fecha_registro_publicacion: new Date(fecha_registro_publicacion),
                    fecha_inicio_publicacion:   fechaInicio,
                    fecha_fin_publicacion:      fechaFin,
                    id_estatus_publicacion:     idEst
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente',
            data: nueva
        });
    } catch (error) {
        console.error('[publicacionesPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /publicaciones/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const publicacionPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        const {
            id_proveedorconservicio,
            imagen,
            fecha_registro_publicacion,
            fecha_inicio_publicacion,
            fecha_fin_publicacion,
            id_estatus_publicacion
        } = req.body;

        // const idPCS = parseInt(id_proveedorconservicio, 10);
        const imagenVal = imagen.trim();

        const fechaInicio = new Date(fecha_inicio_publicacion);
        const fechaFin    = new Date(fecha_fin_publicacion);

        const idEst = parseInt(id_estatus_publicacion, 10);

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Publicaciones.findByPk(id, { transaction: t });
            if (!registro) return null;

            await registro.update(
                {
                    id_proveedorconservicio,
                    imagen:                    imagenVal,
                    fecha_registro_publicacion: new Date(fecha_registro_publicacion),
                    fecha_inicio_publicacion:   fechaInicio,
                    fecha_fin_publicacion:      fechaFin,
                    id_estatus_publicacion:     idEst
                },
                { transaction: t }
            );
            return await Publicaciones.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Publicación actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        console.error('[publicacionesPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /publicaciones/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const publicacionPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        const {
            id_proveedorconservicio,
            imagen,
            fecha_registro_publicacion,
            fecha_inicio_publicacion,
            fecha_fin_publicacion,
            id_estatus_publicacion
        } = req.body;

        const updates = {};

        if (id_proveedorconservicio !== undefined) {
            const idPCS = parseInt(id_proveedorconservicio, 10);
            updates.id_proveedorconservicio = idPCS;
        }

        if (imagen !== undefined) {
            const imagenVal = imagen.trim();
            updates.imagen = imagenVal;
        }

        if (fecha_registro_publicacion !== undefined) {
            updates.fecha_registro_publicacion = new Date(fecha_registro_publicacion);
        }

        if (fecha_inicio_publicacion !== undefined) {
            updates.fecha_inicio_publicacion = new Date(fecha_inicio_publicacion);
        }

        if (fecha_fin_publicacion !== undefined) {
            updates.fecha_fin_publicacion = new Date(fecha_fin_publicacion);
        }

        if (id_estatus_publicacion !== undefined) {
            const idEst = parseInt(id_estatus_publicacion, 10);
            updates.id_estatus_publicacion = idEst;
        }

        // Validar coherencia de fechas con los valores resultantes
        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Publicaciones.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Cruzar fechas resultantes para validar consistencia
            const inicioFinal = updates.fecha_inicio_publicacion ?? registro.fecha_inicio_publicacion;
            const finFinal    = updates.fecha_fin_publicacion    ?? registro.fecha_fin_publicacion;

            if (new Date(finFinal) <= new Date(inicioFinal)) {
                const err = new Error('La fecha_fin_publicacion debe ser posterior a la fecha_inicio_publicacion');
                err.statusCode = 400;
                throw err;
            }

            await registro.update(updates, { transaction: t });
            return await Publicaciones.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Publicación actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[publicacionesPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /publicaciones/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const publicacionDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Publicaciones.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Publicación eliminada correctamente',
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
                message: 'No se puede eliminar: la publicación está referenciada en otras tablas'
            });
        }
        console.error('[publicacionesDelete]', error.message || error);
        return next(error);
    }
};
