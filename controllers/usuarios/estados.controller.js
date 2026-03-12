import Estado from "../../models/usuarios/estados.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
const getMaxLength = (field) => {
    const attrs = Estado.rawAttributes || {};
    // DataTypes.STRING(n) almacena n en type.options.length
    return attrs[field]?.type?.options?.length ?? 100;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/estados
// Obtener todos los estados (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const estadosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre
        const q = (req.query.q || '').trim();
        const where = q ? { estado: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const allowedSortFields = ['id_estado', 'estado'];
        const [sortField = 'id_estado', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_estado:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estado';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await Estado.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortFieldSafe, sortOrder]]
        });

        const total = result.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en estadosGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/estados/:id
// Obtener un estado por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estadoGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const estado = await Estado.findByPk(id);

        if (!estado) {
            return res.status(404).json({ success: false, message: 'Estado no encontrado.' });
        }

        return res.status(200).json({ success: true, data: estado });
    } catch (error) {
        console.error('Error en estadoGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/estados
// Crear un nuevo estado
// ─────────────────────────────────────────────────────────────────────────────
export const estadoPost = async (req, res, next) => {
    try {
        const { estado } = req.body;

        // Validación de presencia y tipo
        if (!estado || typeof estado !== 'string' || estado.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estado es obligatorio y debe ser texto.' });
        }

        const value = estado.trim();

        // Validación de longitud máxima desde el modelo
        const maxLength = getMaxLength('estado');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo estado no puede exceder ${maxLength} caracteres.`
            });
        }

        // Verificación de duplicado + creación dentro de la misma transacción
        const nuevoEstado = await sequelize.transaction(async (t) => {
            const existe = await Estado.findOne({
                where: { estado: value },
                transaction: t
            });
            if (existe) {
                const err = new Error('El estado ya existe.');
                err.statusCode = 409;
                throw err;
            }

            return await Estado.create({ estado: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Estado creado exitosamente.',
            data: nuevoEstado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estadoPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/estados/:id
// Reemplazar completamente un estado por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estadoPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { estado } = req.body;

        // Validación de presencia y tipo (una sola vez, sin duplicar)
        if (!estado || typeof estado !== 'string' || estado.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estado es obligatorio y debe ser texto.' });
        }

        const value = estado.trim();

        // Validación de longitud máxima desde el modelo
        const maxLength = getMaxLength('estado');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo estado no puede exceder ${maxLength} caracteres.`
            });
        }

        // Búsqueda, verificación de duplicado y actualización en una sola transacción
        const estadoActualizado = await sequelize.transaction(async (t) => {
            const record = await Estado.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado solo si el valor cambia
            if (record.estado !== value) {
                const existe = await Estado.findOne({
                    where: {
                        estado: value,
                        id_estado: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (existe) {
                    const err = new Error('El estado ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estado: value }, { transaction: t });
            return record;
        });

        if (estadoActualizado === null) {
            return res.status(404).json({ success: false, message: 'Estado no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado actualizado exitosamente.',
            data: estadoActualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estadoPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/estados/:id
// Actualizar parcialmente un estado por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estadoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { estado } = req.body;

        // El campo es el único actualizable; debe estar presente
        if (estado === undefined || estado === null) {
            return res.status(400).json({ success: false, message: 'El campo estado es requerido.' });
        }
        if (typeof estado !== 'string' || estado.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estado debe ser texto no vacío.' });
        }

        const value = estado.trim();

        const maxLength = getMaxLength('estado');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo estado no puede exceder ${maxLength} caracteres.`
            });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await Estado.findByPk(id, { transaction: t });
            if (!record) return null;

            // Solo verificar duplicado si el valor realmente cambia
            if (record.estado !== value) {
                const duplicate = await Estado.findOne({
                    where: {
                        estado: value,
                        id_estado: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicate) {
                    const err = new Error('El estado ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estado: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Estado no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado actualizado parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estadoPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/estados/:id
// Eliminar un estado por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estadoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Estado.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Estado no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado eliminado correctamente.',
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
                message: 'No se puede eliminar el estado: está referenciado en otros registros.'
            });
        }
        console.error('Error en estadoDelete:', error.message || error);
        return next(error);
    }
};