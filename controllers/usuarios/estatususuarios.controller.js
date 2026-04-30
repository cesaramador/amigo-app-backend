import EstatusUsuario from "../../models/usuarios/estatususuarios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
// const getMaxLength = (field) => {
//    const attrs = EstatusUsuario.rawAttributes || {};
    // DataTypes.STRING(n) almacena n en type.options.length
//    return attrs[field]?.type?.options?.length ?? 20;
//};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/estatususuarios
// Obtener todos los estatus de usuario (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const estatususuariosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { estatus_usuario: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const allowedSortFields = ['id_estatususuario', 'estatus_usuario'];
        const [sortField = 'id_estatususuario', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_estatususuario:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estatususuario';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await EstatusUsuario.findAndCountAll({
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
        console.error('Error en estatususuariosGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/estatususuarios/:id
// Obtener un estatus de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatususuarioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const registro = await EstatusUsuario.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado.' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('Error en estatususuarioGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/estatususuarios
// Crear un nuevo estatus de usuario
// ─────────────────────────────────────────────────────────────────────────────
export const estatususuarioPost = async (req, res, next) => {
    try {
        const value = String(req.body.estatus_usuario).trim();

        // Verificación de duplicado (case-insensitive) + creación dentro de la misma transacción
        const nuevo = await sequelize.transaction(async (t) => {
            const exists = await EstatusUsuario.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('estatus_usuario')),
                    value.toLowerCase()
                ),
                transaction: t
            });
            if (exists) {
                const err = new Error('El estatus de usuario ya existe.');
                err.statusCode = 409;
                throw err;
            }

            return await EstatusUsuario.create({ estatus_usuario: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Estatus de usuario creado exitosamente.',
            data: nuevo
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatususuarioPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/estatususuarios/:id
// Reemplazar completamente un estatus de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatususuarioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const value = String(req.body.estatus_usuario).trim();

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusUsuario.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado case-insensitive solo si el valor cambia
            if (record.estatus_usuario.toLowerCase() !== value.toLowerCase()) {
                const exists = await EstatusUsuario.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('estatus_usuario')),
                                value.toLowerCase()
                            ),
                            { id_estatususuario: { [Op.ne]: id } }
                        ]
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El estatus de usuario ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_usuario: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de usuario actualizado exitosamente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatususuarioPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/estatususuarios/:id
// Actualizar parcialmente un estatus de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatususuarioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const value = String(req.body.estatus_usuario).trim();

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusUsuario.findByPk(id, { transaction: t });
            if (!record) return null;

            // Solo verificar duplicado case-insensitive si el valor realmente cambia
            if (record.estatus_usuario.toLowerCase() !== value.toLowerCase()) {
                const exists = await EstatusUsuario.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('estatus_usuario')),
                                value.toLowerCase()
                            ),
                            { id_estatususuario: { [Op.ne]: id } }
                        ]
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El estatus de usuario ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_usuario: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de usuario actualizado parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatususuarioPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/estatususuarios/:id
// Eliminar un estatus de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const estatususuarioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const deleted = await sequelize.transaction(async (t) => {
            const record = await EstatusUsuario.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de usuario eliminado correctamente.',
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
                message: 'No se puede eliminar el estatus de usuario: está referenciado en otros registros.'
            });
        }
        console.error('Error en estatususuarioDelete:', error.message || error);
        return next(error);
    }
};