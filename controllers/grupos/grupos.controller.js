import Grupos from "../../models/grupos/grupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas las categorías de vivienda
export const gruposGet = async (req, res, next) => {
    try {
        // Paginación y límites seguros
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { nombre_grupo: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_grupo', sortOrderRaw = 'asc'] = (req.query.sort || 'id_grupo:asc').split(':');
        const allowedSortFields = ['id_grupo', 'nombre_grupo'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_grupo';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await Grupos.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortFieldSafe, sortOrder]],
                transaction: t
            });
        });

        const total = result.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en gruposGet:', error.message || error);
        return next(error);
    }
}

// Obtener una categoría de vivienda por ID
export const gruposGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const categoria = await sequelize.transaction(async (t) => {
            return await Grupos.findByPk(id, { transaction: t });
        });

        if (!categoria) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({ success: true, data: categoria });
    } catch (error) {
        console.error('Error en gruposGetById:', error.message || error);
        return next(error);
    }
}

// Crear una nueva categoría de vivienda
export const grupoPost = async (req, res, next) => {
    try {
        const { nombre_grupo } = req.body;

        // Validación básica
        if (!nombre_grupo || typeof nombre_grupo !== 'string' || nombre_grupo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo nombre_grupo es obligatorio' });
        }
        const value = nombre_grupo.trim();

        // Longitud desde el modelo (si está definida)
        const attrs = Grupos.rawAttributes || {};
        const maxLength = attrs.nombre_grupo?.type?.options?.length ?? attrs.nombre_grupo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo nombre_grupo no puede exceder ${maxLength} caracteres` });
        }

        // Verificar duplicado
        const exists = await Grupos.findOne({ where: { nombre_grupo: value } });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El grupo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Grupos.create({ nombre_grupo: value }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Grupo creado exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en grupoPost:', error.message || error);
        return next(error);
    }
}

// Actualizar una categoría de vivienda por ID
export const grupoPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { nombre_grupo } = req.body;
        if (!nombre_grupo || typeof nombre_grupo !== 'string' || nombre_grupo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo nombre_grupo es obligatorio' });
        }
        const value = nombre_grupo.trim();

        // obtener longitud máxima desde el modelo
        const attrs = Grupos.rawAttributes || {};
        const maxLength = attrs.nombre_grupo?.type?.options?.length ?? attrs.nombre_grupo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo nombre_grupo no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await Grupos.findByPk(id, { transaction: t });
            if (!record) return null;

            // comprobar duplicado (excluir el propio registro)
            const exists = await Grupos.findOne({
                where: { nombre_grupo: value, id_grupo: { [Op.ne]: id } },
                transaction: t
            });
            if (exists) {
                const err = new Error('El grupo ya existe');
                err.statusCode = 409;
                throw err;
            }

            await record.update({ nombre_grupo: value }, { transaction: t });
            return await Grupos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Grupo actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error en grupoPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente una categoría de vivienda por ID
export const grupoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { nombre_grupo } = req.body;
        if (typeof nombre_grupo === 'undefined' || nombre_grupo === null) {
            return res.status(400).json({ success: false, message: 'Campo "nombre_grupo" requerido' });
        }
        if (typeof nombre_grupo !== 'string' || nombre_grupo.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "nombre_grupo" inválido' });
        }

        const value = nombre_grupo.trim();
        const attrs = Grupos.rawAttributes || {};
        const maxLength = attrs.nombre_grupo?.type?.options?.length ?? attrs.nombre_grupo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo nombre_grupo no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await Grupos.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.nombre_grupo !== value) {
                const exists = await Grupos.findOne({
                    where: { nombre_grupo: value, id_grupo: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El grupo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ nombre_grupo: value }, { transaction: t });
            return await Grupos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Grupo actualizado parcialmente', data: updated });
    } catch (error) {
        console.error('Error en grupoPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar una categoría de vivienda por ID
export const grupoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Eliminar dentro de transacción
        const deleted = await sequelize.transaction(async (t) => {
            const record = await Grupos.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Grupo eliminado correctamente',
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
        console.error('Error en grupoDelete:', error.message || error);
        return next(error);
    }
}

