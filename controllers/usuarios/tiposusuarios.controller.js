import TiposUsuarios from "../../models/usuarios/tiposusuarios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
// const getMaxLength = (field) => {
//     const attrs = TiposUsuarios.rawAttributes || {};
//     // DataTypes.STRING(n) almacena n en type.options.length
//     return attrs[field]?.type?.options?.length ?? 50;
// };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tiposusuarios
// Obtener todos los tipos de usuario (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const tiposusuariosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { tipo_usuario: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const allowedSortFields = ['id_tipousuario', 'tipo_usuario'];
        const [sortField = 'id_tipousuario', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_tipousuario:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_tipousuario';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await TiposUsuarios.findAndCountAll({
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
        console.error('Error en tiposusuariosGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tiposusuarios/:id
// Obtener un tipo de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const tipousuarioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const registro = await TiposUsuarios.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado.' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('Error en tipousuarioGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/tiposusuarios
// Crear un nuevo tipo de usuario
// ─────────────────────────────────────────────────────────────────────────────
export const tipousuarioPost = async (req, res, next) => {
    try {
        const value = String(req.body.tipo_usuario).trim();

        // Verificación de duplicado (case-insensitive) + creación dentro de la misma transacción
        const nuevo = await sequelize.transaction(async (t) => {
            const exists = await TiposUsuarios.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('tipo_usuario')),
                    value.toLowerCase()
                ),
                transaction: t
            });
            if (exists) {
                const err = new Error('El tipo de usuario ya existe.');
                err.statusCode = 409;
                throw err;
            }

            return await TiposUsuarios.create({ tipo_usuario: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Tipo de usuario creado exitosamente.',
            data: nuevo
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en tipousuarioPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/tiposusuarios/:id
// Reemplazar completamente un tipo de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const tipousuarioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const value = String(req.body.tipo_usuario).trim();

        const updated = await sequelize.transaction(async (t) => {
            const record = await TiposUsuarios.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado case-insensitive solo si el valor cambia,
            // usando Op.ne explícito para excluir el propio registro
            if (record.tipo_usuario.toLowerCase() !== value.toLowerCase()) {
                const exists = await TiposUsuarios.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('tipo_usuario')),
                                value.toLowerCase()
                            ),
                            { id_tipousuario: { [Op.ne]: id } }
                        ]
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El tipo de usuario ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ tipo_usuario: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de usuario actualizado exitosamente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en tipousuarioPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/tiposusuarios/:id
// Actualizar parcialmente un tipo de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const tipousuarioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const value = String(req.body.tipo_usuario).trim();

        const updated = await sequelize.transaction(async (t) => {
            const record = await TiposUsuarios.findByPk(id, { transaction: t });
            if (!record) return null;

            // Solo verificar duplicado case-insensitive si el valor realmente cambia
            if (record.tipo_usuario.toLowerCase() !== value.toLowerCase()) {
                const exists = await TiposUsuarios.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('tipo_usuario')),
                                value.toLowerCase()
                            ),
                            { id_tipousuario: { [Op.ne]: id } }
                        ]
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El tipo de usuario ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ tipo_usuario: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de usuario actualizado parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en tipousuarioPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/tiposusuarios/:id
// Eliminar un tipo de usuario por ID
// ─────────────────────────────────────────────────────────────────────────────
export const tipousuarioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const deleted = await sequelize.transaction(async (t) => {
            const record = await TiposUsuarios.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de usuario eliminado correctamente.',
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
                message: 'No se puede eliminar el tipo de usuario: está referenciado en otros registros.'
            });
        }
        console.error('Error en tipousuarioDelete:', error.message || error);
        return next(error);
    }
};
