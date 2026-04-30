import EstatusPublicaciones from "../../models/proveedores/estatuspublicaciones.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_estatuspublicacion', 'estatus_publicacion'];
const DEFAULT_SORT_FIELD  = 'id_estatuspublicacion';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
// const MAX_ESTATUS_PUBLICACION = 20;

// ─────────────────────────────────────────────────────────────────────────────
// GET /estatuspublicaciones  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const estatuspublicacionesGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo estatus_publicacion
        const q     = (req.query.q || '').trim();
        const where = q ? { estatus_publicacion: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await EstatusPublicaciones.findAndCountAll({
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
        console.error('[estatuspublicacionesGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /estatuspublicaciones/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const estatuspublicacionGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Lectura simple: sin transacción explícita
        const registro = await EstatusPublicaciones.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Estatus de publicación no encontrado'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[estatuspublicacionesGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /estatuspublicaciones  →  crear nuevo estatus de publicación
// ─────────────────────────────────────────────────────────────────────────────
export const estatuspublicacionPost = async (req, res, next) => {
    try {
        const value = String(req.body.estatus_publicacion).trim();

        // Verificar duplicado
        const exists = await EstatusPublicaciones.findOne({ where: { estatus_publicacion: value } });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'El estatus de publicación ya existe'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await EstatusPublicaciones.create({ estatus_publicacion: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Estatus de publicación creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[estatuspublicacionesPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /estatuspublicaciones/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const estatuspublicacionPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const value = String(req.body.estatus_publicacion).trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await EstatusPublicaciones.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            const duplicado = await EstatusPublicaciones.findOne({
                where: {
                    estatus_publicacion:   value,
                    id_estatuspublicacion: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El estatus de publicación ya existe');
                err.statusCode = 409;
                throw err;
            }

            await registro.update({ estatus_publicacion: value }, { transaction: t });
            return await EstatusPublicaciones.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Estatus de publicación no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de publicación actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[estatuspublicacionesPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /estatuspublicaciones/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const estatuspublicacionPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const value = String(req.body.estatus_publicacion).trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await EstatusPublicaciones.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Solo verificar duplicado si el valor realmente cambia
            if (registro.estatus_publicacion !== value) {
                const duplicado = await EstatusPublicaciones.findOne({
                    where: {
                        estatus_publicacion:   value,
                        id_estatuspublicacion: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El estatus de publicación ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update({ estatus_publicacion: value }, { transaction: t });
            return await EstatusPublicaciones.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Estatus de publicación no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de publicación actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[estatuspublicacionesPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /estatuspublicaciones/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const estatuspublicacionDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await EstatusPublicaciones.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Estatus de publicación no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de publicación eliminado correctamente',
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
                message: 'No se puede eliminar: el estatus de publicación está referenciado en otras tablas'
            });
        }
        console.error('[estatuspublicacionesDelete]', error.message || error);
        return next(error);
    }
};
