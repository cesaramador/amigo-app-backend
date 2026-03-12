import Genero from "../../models/usuarios/generos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
const getMaxLength = (field) => {
    const attrs = Genero.rawAttributes || {};
    // DataTypes.STRING(n) almacena n en type.options.length
    return attrs[field]?.type?.options?.length ?? 10;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/generos
// Obtener todos los géneros (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const generosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre
        const q = (req.query.q || '').trim();
        const where = q ? { genero: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const allowedSortFields = ['id_genero', 'genero'];
        const [sortField = 'id_genero', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_genero:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_genero';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await Genero.findAndCountAll({
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
        console.error('Error en generosGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/generos/:id
// Obtener un género por ID
// ─────────────────────────────────────────────────────────────────────────────
export const generoGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const genero = await Genero.findByPk(id);

        if (!genero) {
            return res.status(404).json({ success: false, message: 'Género no encontrado.' });
        }

        return res.status(200).json({ success: true, data: genero });
    } catch (error) {
        console.error('Error en generoGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/generos
// Crear un nuevo género
// ─────────────────────────────────────────────────────────────────────────────
export const generoPost = async (req, res, next) => {
    try {
        const { genero } = req.body;

        // Validación de presencia y tipo
        if (!genero || typeof genero !== 'string' || genero.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo genero es obligatorio y debe ser texto.' });
        }

        const value = genero.trim();

        // Validación de longitud máxima desde el modelo
        const maxLength = getMaxLength('genero');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo genero no puede exceder ${maxLength} caracteres.`
            });
        }

        // Verificación de duplicado + creación dentro de la misma transacción
        const nuevoGenero = await sequelize.transaction(async (t) => {
            const existe = await Genero.findOne({
                where: { genero: value },
                transaction: t
            });
            if (existe) {
                const err = new Error('El género ya existe.');
                err.statusCode = 409;
                throw err;
            }

            return await Genero.create({ genero: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Género creado exitosamente.',
            data: nuevoGenero
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en generoPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/generos/:id
// Reemplazar completamente un género por ID
// ─────────────────────────────────────────────────────────────────────────────
export const generoPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { genero } = req.body;

        // Una sola validación unificada (sin duplicar guardas)
        if (!genero || typeof genero !== 'string' || genero.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo genero es obligatorio y debe ser texto.' });
        }

        const value = genero.trim();

        const maxLength = getMaxLength('genero');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo genero no puede exceder ${maxLength} caracteres.`
            });
        }

        // Búsqueda, verificación de duplicado y actualización en una sola transacción
        const generoActualizado = await sequelize.transaction(async (t) => {
            const record = await Genero.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado solo si el valor cambia
            if (record.genero !== value) {
                const existe = await Genero.findOne({
                    where: {
                        genero: value,
                        id_genero: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (existe) {
                    const err = new Error('El género ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ genero: value }, { transaction: t });
            return record;
        });

        if (generoActualizado === null) {
            return res.status(404).json({ success: false, message: 'Género no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Género actualizado exitosamente.',
            data: generoActualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en generoPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/generos/:id
// Actualizar parcialmente un género por ID
// ─────────────────────────────────────────────────────────────────────────────
export const generoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { genero } = req.body;

        // El campo es el único actualizable; debe estar presente
        if (genero === undefined || genero === null) {
            return res.status(400).json({ success: false, message: 'El campo genero es requerido.' });
        }
        if (typeof genero !== 'string' || genero.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo genero debe ser texto no vacío.' });
        }

        const value = genero.trim();

        const maxLength = getMaxLength('genero');
        if (value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo genero no puede exceder ${maxLength} caracteres.`
            });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await Genero.findByPk(id, { transaction: t });
            if (!record) return null;

            // Solo verificar duplicado si el valor realmente cambia
            if (record.genero !== value) {
                const duplicate = await Genero.findOne({
                    where: {
                        genero: value,
                        id_genero: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicate) {
                    const err = new Error('El género ya existe.');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ genero: value }, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Género no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Género actualizado parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en generoPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/generos/:id
// Eliminar un género por ID
// ─────────────────────────────────────────────────────────────────────────────
export const generoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Genero.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Género no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Género eliminado correctamente.',
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
                message: 'No se puede eliminar el género: está referenciado en otros registros.'
            });
        }
        console.error('Error en generoDelete:', error.message || error);
        return next(error);
    }
};