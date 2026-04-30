import EstatusMaritales from "../../models/usuarios/estatusmaritales.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
// const getMaxLength = (field) => {
//    const attrs = EstatusMaritales.rawAttributes || {};
    // DataTypes.STRING(n) almacena n en type.options.length
//    return attrs[field]?.type?.options?.length ?? 20;
//};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/estatusmaritales
// Obtener todos los estatus maritales (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const estatusmaritalesGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre — campo corregido a 'estatus_marital'
        const q = (req.query.q || '').trim();
        const where = q ? { estatus_marital: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const allowedSortFields = ['id_estatusmarital', 'estatus_marital'];
        const [sortField = 'id_estatusmarital', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_estatusmarital:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estatusmarital';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await EstatusMaritales.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortFieldSafe, sortOrder]]
        });

        const total = result.count;
        const pages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en estatusmaritalesGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/estatusmaritales/:id
// Obtener un estatus marital por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatusmaritalGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const registro = await EstatusMaritales.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado.' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('Error en estatusmaritalGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/estatusmaritales
// Crear un nuevo estatus marital
// ─────────────────────────────────────────────────────────────────────────────
export const estatusmaritalPost = async (req, res, next) => {
    try {
        const value = String(req.body.estatus_marital).trim();

        // Verificación de duplicado (case-insensitive) + creación dentro de la misma transacción
        const nuevo = await sequelize.transaction(async (t) => {
            const exists = await EstatusMaritales.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('estatus_marital')),
                    value.toLowerCase()
                ),
                transaction: t
            });
            if (exists) {
                const err = new Error('El estatus marital ya existe.');
                err.statusCode = 409;
                throw err;
            }

            return await EstatusMaritales.create({ estatus_marital: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Estatus marital creado exitosamente.',
            data: nuevo
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatusmaritalPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/estatusmaritales/:id
// Reemplazar completamente un estatus marital por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatusmaritalPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const value = String(req.body.estatus_marital).trim();

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusMaritales.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado case-insensitive solo si el valor cambia
            if (record.estatus_marital.toLowerCase() !== value.toLowerCase()) {
                const exists = await EstatusMaritales.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('estatus_marital')),
                                value.toLowerCase()
                            ),
                            { id_estatusmarital: { [Op.ne]: id } }
                        ]
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El estatus marital ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_marital: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus marital actualizado exitosamente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatusmaritalPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/estatusmaritales/:id
// Actualizar parcialmente un estatus marital por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatusmaritalPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const value = String(req.body.estatus_marital).trim();

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusMaritales.findByPk(id, { transaction: t });
            if (!record) return null;

            // Solo verificar duplicado case-insensitive si el valor realmente cambia
            if (record.estatus_marital.toLowerCase() !== value.toLowerCase()) {
                const exists = await EstatusMaritales.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('estatus_marital')),
                                value.toLowerCase()
                            ),
                            { id_estatusmarital: { [Op.ne]: id } }
                        ]
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El estatus marital ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_marital: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus marital actualizado parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatusmaritalPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/estatusmaritales/:id
// Eliminar un estatus marital por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatusmaritalDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const deleted = await sequelize.transaction(async (t) => {
            const record = await EstatusMaritales.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus marital eliminado correctamente.',
            data: deleted
        });
    } catch (error) {
        // Manejo específico de violación de FK
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el estatus marital: está referenciado en otros registros.'
            });
        }
        console.error('Error en estatusmaritalDelete:', error.message || error);
        return next(error);
    }
};