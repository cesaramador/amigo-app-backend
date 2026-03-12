import CategoriasViviendas from "../../models/usuarios/categoriasviviendas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
const getMaxLength = (field) => {
    const attrs = CategoriasViviendas.rawAttributes || {};
    // DataTypes.STRING(n) guarda n en type.options.length
    return attrs[field]?.type?.options?.length ?? 20;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/categoriasviviendas
// Obtener todas las categorías de vivienda (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const categoriasviviendasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { categoria_vivienda: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const allowedSortFields = ['id_categoriavivienda', 'categoria_vivienda'];
        const [sortField = 'id_categoriavivienda', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_categoriavivienda:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_categoriavivienda';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await CategoriasViviendas.findAndCountAll({
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
        console.error('Error en categoriasviviendasGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/categoriasviviendas/:id
// Obtener una categoría de vivienda por ID
// ─────────────────────────────────────────────────────────────────────────────
export const categoriaviviendaGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const categoria = await CategoriasViviendas.findByPk(id);

        if (!categoria) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada.' });
        }

        return res.status(200).json({ success: true, data: categoria });
    } catch (error) {
        console.error('Error en categoriaviviendaGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/categoriasviviendas
// Crear una nueva categoría de vivienda
// ─────────────────────────────────────────────────────────────────────────────
export const categoriaviviendaPost = async (req, res, next) => {
    try {
        const { categoria_vivienda } = req.body;

        // Validación de presencia y tipo
        if (!categoria_vivienda || typeof categoria_vivienda !== 'string' || categoria_vivienda.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo categoria_vivienda es obligatorio y debe ser texto.' });
        }

        const value = categoria_vivienda.trim();

        // Validación de longitud máxima desde el modelo
        const maxLength = getMaxLength('categoria_vivienda');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo categoria_vivienda no puede exceder ${maxLength} caracteres.`
            });
        }

        // Verificación de duplicado + creación dentro de la misma transacción
        const nuevo = await sequelize.transaction(async (t) => {
            const exists = await CategoriasViviendas.findOne({
                where: { categoria_vivienda: value },
                transaction: t
            });
            if (exists) {
                const err = new Error('La categoría de vivienda ya existe.');
                err.statusCode = 409;
                throw err;
            }

            return await CategoriasViviendas.create({ categoria_vivienda: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Categoría de vivienda creada exitosamente.',
            data: nuevo
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en categoriaviviendaPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/categoriasviviendas/:id
// Reemplazar completamente una categoría de vivienda por ID
// ─────────────────────────────────────────────────────────────────────────────
export const categoriaviviendaPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { categoria_vivienda } = req.body;
        if (!categoria_vivienda || typeof categoria_vivienda !== 'string' || categoria_vivienda.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo categoria_vivienda es obligatorio y debe ser texto.' });
        }

        const value = categoria_vivienda.trim();

        const maxLength = getMaxLength('categoria_vivienda');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo categoria_vivienda no puede exceder ${maxLength} caracteres.`
            });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await CategoriasViviendas.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado excluyendo el propio registro
            const exists = await CategoriasViviendas.findOne({
                where: {
                    categoria_vivienda: value,
                    id_categoriavivienda: { [Op.ne]: id }
                },
                transaction: t
            });
            if (exists) {
                const err = new Error('La categoría de vivienda ya existe.');
                err.statusCode = 409;
                throw err;
            }

            await record.update({ categoria_vivienda: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría de vivienda actualizada exitosamente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en categoriaviviendaPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/categoriasviviendas/:id
// Actualizar parcialmente una categoría de vivienda por ID
// ─────────────────────────────────────────────────────────────────────────────
export const categoriaviviendaPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { categoria_vivienda } = req.body;

        // El campo es el único actualizable; debe estar presente
        if (categoria_vivienda === undefined || categoria_vivienda === null) {
            return res.status(400).json({ success: false, message: 'El campo categoria_vivienda es requerido.' });
        }
        if (typeof categoria_vivienda !== 'string' || categoria_vivienda.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo categoria_vivienda debe ser texto no vacío.' });
        }

        const value = categoria_vivienda.trim();

        const maxLength = getMaxLength('categoria_vivienda');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo categoria_vivienda no puede exceder ${maxLength} caracteres.`
            });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await CategoriasViviendas.findByPk(id, { transaction: t });
            if (!record) return null;

            // Solo verificar duplicado si el valor cambia
            if (record.categoria_vivienda !== value) {
                const exists = await CategoriasViviendas.findOne({
                    where: {
                        categoria_vivienda: value,
                        id_categoriavivienda: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('La categoría de vivienda ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ categoria_vivienda: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría de vivienda actualizada parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en categoriaviviendaPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/categoriasviviendas/:id
// Eliminar una categoría de vivienda por ID
// ─────────────────────────────────────────────────────────────────────────────
export const categoriaviviendaDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await CategoriasViviendas.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Categoría de vivienda no encontrada.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría de vivienda eliminada correctamente.',
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
                message: 'No se puede eliminar: la categoría está referenciada en otros registros.'
            });
        }
        console.error('Error en categoriaviviendaDelete:', error.message || error);
        return next(error);
    }
};
