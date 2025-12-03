import TiposUsuarios from "../../models/usuarios/tiposusuarios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todos los tipos de usuarios
export const tiposusuariosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { tipo_usuario: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = 'id_tipousuario', sortOrderRaw = 'asc'] = (req.query.sort || 'id_tipousuario:asc').split(':');
        const allowedSortFields = ['id_tipousuario', 'tipo_usuario'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_tipousuario';
        const sortOrder = String(sortOrderRaw).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await TiposUsuarios.findAndCountAll({
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
            message: 'Tipos de usuarios obtenidos exitosamente',
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en tiposusuariosGet:', error.message || error);
        return next(error);
    }
}

// Obtener un tipo de usuario por ID
export const tipousuarioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const registro = await sequelize.transaction(async (t) => {
            return await TiposUsuarios.findByPk(id, { transaction: t });
        });

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('Error en tiposusuariosGetById:', error.message || error);
        return next(error);
    }
}

// Crear un nuevo tipo de usuario
export const tipousuarioPost = async (req, res, next) => {
    try {
        const { tipo_usuario } = req.body;

        // Validación básica
        if (!tipo_usuario || typeof tipo_usuario !== 'string' || tipo_usuario.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo tipo_usuario es obligatorio' });
        }
        const value = tipo_usuario.trim();

        // Longitud desde el modelo (si está definida)
        const attrs = TiposUsuarios.rawAttributes || {};
        const maxLength = attrs.tipo_usuario?.type?.options?.length ?? attrs.tipo_usuario?._length ?? 50;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo tipo_usuario no puede exceder ${maxLength} caracteres` });
        }

        // Verificar duplicado (case-insensitive)
        const exists = await TiposUsuarios.findOne({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('tipo_usuario')),
                value.toLowerCase()
            )
        });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El tipo de usuario ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await TiposUsuarios.create({ tipo_usuario: value }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Tipo de usuario creado exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en tiposusuariosPost:', error.message || error);
        return next(error);
    }
}

// Actualizar un tipo de usuario por ID
export const tipousuarioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { tipo_usuario } = req.body;
        if (!tipo_usuario || typeof tipo_usuario !== 'string' || tipo_usuario.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo tipo_usuario es obligatorio' });
        }
        const value = tipo_usuario.trim();

        // longitud desde el modelo
        const attrs = TiposUsuarios.rawAttributes || {};
        const maxLength = attrs.tipo_usuario?.type?.options?.length ?? attrs.tipo_usuario?._length ?? 50;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo tipo_usuario no puede exceder ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await TiposUsuarios.findByPk(id, { transaction: t });
            if (!record) return null;

            // verificar duplicado (case-insensitive) excluyendo el propio registro
            const exists = await TiposUsuarios.findOne({
                where: sequelize.where(
                    sequelize.fn('lower', sequelize.col('tipo_usuario')),
                    value.toLowerCase()
                ),
                transaction: t
            });
            if (exists && ((exists.id_tipousuario ?? exists.id) !== id)) {
                const err = new Error('El tipo de usuario ya existe');
                err.statusCode = 409;
                throw err;
            }

            await record.update({ tipo_usuario: value }, { transaction: t });
            return await TiposUsuarios.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Tipo de usuario actualizado', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en tiposusuariosPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente un tipo de usuario por ID
export const tipousuarioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { tipo_usuario } = req.body;
        if (typeof tipo_usuario === 'undefined') {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }
        if (tipo_usuario === null || typeof tipo_usuario !== 'string' || tipo_usuario.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "tipo_usuario" inválido' });
        }

        const value = tipo_usuario.trim();

        // Obtener longitud desde el modelo si existe
        const attrs = TiposUsuarios.rawAttributes || {};
        const maxLength = attrs.tipo_usuario?.type?.options?.length ?? attrs.tipo_usuario?._length ?? 50;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo tipo_usuario no puede exceder ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await TiposUsuarios.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.tipo_usuario !== value) {
                const exists = await TiposUsuarios.findOne({
                    where: sequelize.where(
                        sequelize.fn('lower', sequelize.col('tipo_usuario')),
                        value.toLowerCase()
                    ),
                    transaction: t
                });
                if (exists && ((exists.id_tipousuario ?? exists.id) !== id)) {
                    const err = new Error('El tipo de usuario ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ tipo_usuario: value }, { transaction: t });
            return await TiposUsuarios.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Tipo de usuario actualizado parcialmente', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en tiposusuariosPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar un tipo de usuario por ID
export const tipousuarioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await TiposUsuarios.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Tipo de usuario no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de usuario eliminado correctamente',
            data: deleted
        });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError' || /foreign key|referenc/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: existen referencias en otras tablas'
            });
        }
        console.error('Error en tiposusuariosDelete:', error.message || error);
        return next(error);
    }
}

