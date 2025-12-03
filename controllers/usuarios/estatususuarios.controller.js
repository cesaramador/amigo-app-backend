import EstatusUsuario from "../../models/usuarios/estatususuarios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// obtener todos los estatus de usuarios
export const estatususuariosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto (campo ejemplo: estatus_usuario) y filtros simples
        const q = (req.query.q || '').trim();
        const where = q ? { estatus_usuario: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = 'id_estatususuario', sortOrderRaw = 'asc'] = (req.query.sort || 'id_estatususuario:asc').split(':');
        const allowedSortFields = ['id_estatususuario', 'estatus_usuario'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estatususuario';
        const sortOrder = String(sortOrderRaw).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta dentro de transacción para consistencia
        const result = await sequelize.transaction(async (t) => {
            return await EstatusUsuario.findAndCountAll({
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
        console.error('Error en estatususuarioGet:', error.message || error);
        return next(error);
    }
}

// obtener un estatus de usuario por id
export const estatususuarioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const registro = await sequelize.transaction(async (t) => {
            return await EstatusUsuario.findByPk(id, { transaction: t });
        });

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('Error en estatususuarioGetById:', error.message || error);
        return next(error);
    }
}

// crear un nuevo estatus de usuario
export const estatususuarioPost = async (req, res, next) => {
    try {
        const { estatus_usuario } = req.body;

        // validación básica
        if (!estatus_usuario || typeof estatus_usuario !== 'string' || estatus_usuario.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estatus_usuario es obligatorio' });
        }
        const value = estatus_usuario.trim();

        // longitud desde el modelo (si está definida)
        const attrs = EstatusUsuario.rawAttributes || {};
        const maxLength = attrs.estatus_usuario?.type?.options?.length ?? attrs.estatus_usuario?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_usuario no puede exceder ${maxLength} caracteres` });
        }

        // verificar duplicado (case-insensitive)
        const exists = await EstatusUsuario.findOne({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('estatus_usuario')),
                value.toLowerCase()
            )
        });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El estatus de usuario ya existe' });
        }

        // crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await EstatusUsuario.create({ estatus_usuario: value }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Estatus de usuario creado', data: nuevo });
    } catch (error) {
        console.error('Error en estatususuarioPost:', error.message || error);
        return next(error);
    }
}

// actualizar un estatus de usuario por id
export const estatususuarioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estatus_usuario } = req.body;
        if (!estatus_usuario || typeof estatus_usuario !== 'string' || estatus_usuario.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estatus_usuario es obligatorio' });
        }
        const value = estatus_usuario.trim();

        // obtener longitud máxima desde el modelo si está definida
        const attrs = EstatusUsuario.rawAttributes || {};
        const maxLength = attrs.estatus_usuario?.type?.options?.length ?? attrs.estatus_usuario?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_usuario no puede exceder ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusUsuario.findByPk(id, { transaction: t });
            if (!record) return null;

            // si cambia, verificar existencia de duplicado (case-insensitive)
            if (record.estatus_usuario !== value) {
                const exists = await EstatusUsuario.findOne({
                    where: sequelize.where(
                        sequelize.fn('lower', sequelize.col('estatus_usuario')),
                        value.toLowerCase()
                    ),
                    transaction: t
                });
                if (exists && (exists.id_estatususuario ?? exists.id) !== id) {
                    const err = new Error('El estatus de usuario ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_usuario: value }, { transaction: t });
            return await EstatusUsuario.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Estatus de usuario actualizado', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatususuarioPut:', error.message || error);
        return next(error);
    }
}

// actualizar un estatus de usuario por id
export const estatususuarioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estatus_usuario } = req.body;
        if (typeof estatus_usuario === 'undefined') {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }

        if (estatus_usuario === null || typeof estatus_usuario !== 'string' || estatus_usuario.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "estatus_usuario" inválido' });
        }
        const value = estatus_usuario.trim();

        // obtener longitud máxima desde el modelo si está definida
        const attrs = EstatusUsuario.rawAttributes || {};
        const maxLength = attrs.estatus_usuario?.type?.options?.length ?? attrs.estatus_usuario?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_usuario no puede exceder ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusUsuario.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.estatus_usuario !== value) {
                const exists = await EstatusUsuario.findOne({
                    where: sequelize.where(
                        sequelize.fn('lower', sequelize.col('estatus_usuario')),
                        value.toLowerCase()
                    ),
                    transaction: t
                });
                if (exists && (exists.id_estatususuario ?? exists.id) !== id) {
                    const err = new Error('El estatus de usuario ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_usuario: value }, { transaction: t });
            return await EstatusUsuario.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Estatus de usuario actualizado parcialmente', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estatususuarioPatch:', error.message || error);
        return next(error);
    }
}

// eliminar un estatus de usuario por id
export const estatususuarioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await EstatusUsuario.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Estatus de usuario no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de usuario eliminado correctamente',
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
        console.error('Error en estatususuarioDelete:', error.message || error);
        return next(error);
    }
}