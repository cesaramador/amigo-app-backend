import EstatusMaritales from "../../models/usuarios/estatusmaritales.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// obtener todos los estatus maritales
export const estatusmaritalesGet = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        const q = (req.query.q || '').trim();
        const where = q ? { categoria_vivienda: { [Op.like]: `%${q}%` } } : {};

        const [sortField = 'id_estatusmarital', sortOrderRaw = 'asc'] = (req.query.sort || 'id_estatusmarital:asc').split(':');
        const allowedSortFields = ['id_estatusmarital', 'estatus_marital'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estatusmarital';
        const sortOrder = String(sortOrderRaw).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await sequelize.transaction(async (t) => {
            return await EstatusMaritales.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortFieldSafe, sortOrder]],
                transaction: t
            });
        });

        const total = result.count;
        const pages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en estatusmaritalGet:', error.message || error);
        return next(error);
    }
}

// obtener un estatus marital por id
export const estatusmaritalGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const registro = await sequelize.transaction(async (t) => {
            return await EstatusMaritales.findByPk(id, { transaction: t });
        });

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('Error en estatusmaritalGetById:', error.message || error);
        return next(error);
    }
}

// crear un nuevo estatus marital
export const estatusmaritalPost = async (req, res, next) => {
    try {
        const { estatus_marital } = req.body;

        // validación básica
        if (!estatus_marital || typeof estatus_marital !== 'string' || estatus_marital.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estatus_marital es obligatorio' });
        }
        const value = estatus_marital.trim();

        // obtener longitud máxima desde el modelo si está definida
        const attrs = EstatusMaritales.rawAttributes || {};
        const maxLength = attrs.estatus_marital?.type?.options?.length ?? attrs.estatus_marital?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_marital no puede exceder ${maxLength} caracteres` });
        }

        // verificar duplicado (case-insensitive)
        const exists = await EstatusMaritales.findOne({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('estatus_marital')),
                value.toLowerCase()
            )
        });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El estatus marital ya existe' });
        }

        // crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await EstatusMaritales.create({ estatus_marital: value }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Estatus marital creado', data: nuevo });
    } catch (error) {
        console.error('Error en estatusmaritalPost:', error.message || error);
        return next(error);
    }
}

// actualizar un estatus marital por id
export const estatusmaritalPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estatus_marital } = req.body;
        if (!estatus_marital || typeof estatus_marital !== 'string' || estatus_marital.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estatus_marital es obligatorio' });
        }
        const value = estatus_marital.trim();

        // obtener longitud máxima desde el modelo si está definida
        const attrs = EstatusMaritales.rawAttributes || {};
        const maxLength = attrs.estatus_marital?.type?.options?.length ?? attrs.estatus_marital?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_marital no puede exceder ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusMaritales.findByPk(id, { transaction: t });
            if (!record) return null;

            // si cambia, verificar existencia de duplicado (case-insensitive)
            if (record.estatus_marital !== value) {
                const exists = await EstatusMaritales.findOne({
                    where: sequelize.where(
                        sequelize.fn('lower', sequelize.col('estatus_marital')),
                        value.toLowerCase()
                    ),
                    transaction: t
                });
                if (exists && (exists.id_estatusmarital ?? exists.id) !== id) {
                    const err = new Error('El estatus marital ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_marital: value }, { transaction: t });
            return await EstatusMaritales.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Estatus marital actualizado', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatusmaritalPut:', error.message || error);
        return next(error);
    }
}

// actualizar un estatus marital por id
export const estatusmaritalPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estatus_marital } = req.body;
        if (typeof estatus_marital === 'undefined') {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }

        if (estatus_marital === null || typeof estatus_marital !== 'string' || estatus_marital.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "estatus_marital" inválido' });
        }
        const value = estatus_marital.trim();

        // obtener longitud máxima desde el modelo si está definida
        const attrs = EstatusMaritales.rawAttributes || {};
        const maxLength = attrs.estatus_marital?.type?.options?.length ?? attrs.estatus_marital?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_marital no puede exceder ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusMaritales.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.estatus_marital !== value) {
                const exists = await EstatusMaritales.findOne({
                    where: sequelize.where(
                        sequelize.fn('lower', sequelize.col('estatus_marital')),
                        value.toLowerCase()
                    ),
                    transaction: t
                });
                if (exists && (exists.id_estatusmarital ?? exists.id) !== id) {
                    const err = new Error('El estatus marital ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_marital: value }, { transaction: t });
            return await EstatusMaritales.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Estatus marital actualizado parcialmente', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatusmaritalPatch:', error.message || error);
        return next(error);
    }
}

// eliminar un estatus marital por id
export const estatusmaritalDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await EstatusMaritales.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Estatus marital no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus marital eliminado correctamente',
            data: deleted
        });
    } catch (error) {
        // Manejo específico de FK constraint
        if (error.name === 'SequelizeForeignKeyConstraintError' || /foreign key|referenc/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: existen referencias en otras tablas'
            });
        }
        console.error('Error en estatusmaritalDelete:', error.message || error);
        return next(error);
    }
}