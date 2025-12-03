import CategoriasViviendas from "../../models/usuarios/categoriasviviendas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas las categorías de vivienda
export const categoriasviviendasGet = async (req, res, next) => {
    try {
        // Paginación y límites seguros
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { categoria_vivienda: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_categoriavivienda', sortOrderRaw = 'asc'] = (req.query.sort || 'id_categoriavivienda:asc').split(':');
        const allowedSortFields = ['id_categoriavivienda', 'categoria_vivienda'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_categoriavivienda';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await CategoriasViviendas.findAndCountAll({
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
        console.error('Error en categoriaviviendaGet:', error.message || error);
        if (typeof next === 'function') return next(error);
        return res.status(500).json({ success: false, message: 'Error al obtener categorías de vivienda' });
    }
}

// Obtener una categoría de vivienda por ID
export const categoriaviviendaGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const categoria = await sequelize.transaction(async (t) => {
            return await CategoriasViviendas.findByPk(id, { transaction: t });
        });

        if (!categoria) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada' });
        }

        return res.status(200).json({ success: true, data: categoria });
    } catch (error) {
        console.error('Error en categoriaviviendaGetById:', error.message || error);
        return next(error);
    }
}

// Crear una nueva categoría de vivienda
export const categoriaviviendaPost = async (req, res, next) => {
    try {
        const { categoria_vivienda } = req.body;

        // Validación básica
        if (!categoria_vivienda || typeof categoria_vivienda !== 'string' || categoria_vivienda.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo categoria_vivienda es obligatorio' });
        }
        const value = categoria_vivienda.trim();

        // Longitud desde el modelo (si está definida)
        const attrs = CategoriasViviendas.rawAttributes || {};
        const maxLength = attrs.categoria_vivienda?.type?.options?.length ?? attrs.categoria_vivienda?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo categoria_vivienda no puede exceder ${maxLength} caracteres` });
        }

        // Verificar duplicado
        const exists = await CategoriasViviendas.findOne({ where: { categoria_vivienda: value } });
        if (exists) {
            return res.status(409).json({ success: false, message: 'La categoría de vivienda ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await CategoriasViviendas.create({ categoria_vivienda: value }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Categoría de vivienda creada exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en categoriaviviendaPost:', error.message || error);
        return next(error);
    }
}

// Actualizar una categoría de vivienda por ID
export const categoriaviviendaPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { categoria_vivienda } = req.body;
        if (!categoria_vivienda || typeof categoria_vivienda !== 'string' || categoria_vivienda.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo categoria_vivienda es obligatorio' });
        }
        const value = categoria_vivienda.trim();

        // obtener longitud máxima desde el modelo
        const attrs = CategoriasViviendas.rawAttributes || {};
        const maxLength = attrs.categoria_vivienda?.type?.options?.length ?? attrs.categoria_vivienda?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo categoria_vivienda no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await CategoriasViviendas.findByPk(id, { transaction: t });
            if (!record) return null;

            // comprobar duplicado (excluir el propio registro)
            const exists = await CategoriasViviendas.findOne({
                where: { categoria_vivienda: value, id_categoriavivienda: { [Op.ne]: id } },
                transaction: t
            });
            if (exists) {
                const err = new Error('La categoría de vivienda ya existe');
                err.statusCode = 409;
                throw err;
            }

            await record.update({ categoria_vivienda: value }, { transaction: t });
            return await CategoriasViviendas.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Categoría actualizada exitosamente', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en categoriaviviendaPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente una categoría de vivienda por ID
export const categoriaviviendaPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { categoria_vivienda } = req.body;
        if (typeof categoria_vivienda === 'undefined' || categoria_vivienda === null) {
            return res.status(400).json({ success: false, message: 'Campo "categoria_vivienda" requerido' });
        }
        if (typeof categoria_vivienda !== 'string' || categoria_vivienda.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "categoria_vivienda" inválido' });
        }

        const value = categoria_vivienda.trim();
        const attrs = CategoriasViviendas.rawAttributes || {};
        const maxLength = attrs.categoria_vivienda?.type?.options?.length ?? attrs.categoria_vivienda?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo categoria_vivienda no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await CategoriasViviendas.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.categoria_vivienda !== value) {
                const exists = await CategoriasViviendas.findOne({
                    where: { categoria_vivienda: value, id_categoriavivienda: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('La categoría de vivienda ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ categoria_vivienda: value }, { transaction: t });
            return await CategoriasViviendas.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Categoría actualizada parcialmente', data: updated });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en categoriaviviendaPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar una categoría de vivienda por ID
export const categoriaviviendaDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Eliminar dentro de transacción
        const deleted = await sequelize.transaction(async (t) => {
            const record = await CategoriasViviendas.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría de vivienda eliminada correctamente',
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
        console.error('Error en categoriaviviendaDelete:', error.message || error);
        return next(error);
    }
}

