import Genero from "../../models/usuarios/generos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Leer todos los generos
export const generosGet = async (req, res, next) => {
    try {
        // Paginación
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre
        const q = (req.query.q || '').trim();
        const where = q ? { genero: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_genero', sortOrderRaw = 'asc'] = (req.query.sort || 'id_genero:asc').split(':');
        const allowedSortFields = ['id_genero', 'genero'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_genero';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Ejecutar consulta con transacción
        const generos = await sequelize.transaction(async (t) => {
            return await Genero.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortFieldSafe, sortOrder]],
                transaction: t
            });
        });

        const total = generos.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            message: 'Géneros obtenidos exitosamente',
            meta: {
                total,
                page,
                pages,
                limit,
                sort: `${sortFieldSafe}:${sortOrder}`
            },
            data: generos.rows
        });
    } catch (error) {
        console.error('Error en generosGet:', error.message || error);
        return next(error);
    }
}

// Leer un genero por id
export const generoGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'ID inválido' 
            });
        }

        // Buscar género con transacción
        const genero = await sequelize.transaction(async (t) => {
            return await Genero.findByPk(id, {
                transaction: t
            });
        });

        if (!genero) {
            return res.status(404).json({ 
                success: false,
                message: 'Género no encontrado' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Género obtenido exitosamente',
            data: genero
        });
    } catch (error) {
        console.error('Error en generosGetById:', error.message || error);
        return next(error);
    }
}

// Crear un nuevo genero
export const generoPost = async (req, res, next) => {
    try {
        const { genero } = req.body;

        // Validar que el campo genero no esté vacío
        if (!genero || (typeof genero === 'string' && genero.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'El campo genero es obligatorio'
            });
        }

        // Validar longitud máxima
        const attrs = Genero.rawAttributes || {};
        const maxLength = attrs.genero?.type?.options?.length ?? 10;
        if (String(genero).length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo genero no puede exceder ${maxLength} caracteres`
            });
        }

        // Verificar si el género ya existe
        const existe = await Genero.findOne({ where: { genero: genero.trim() } });
        if (existe) {
            return res.status(409).json({
                success: false,
                message: 'El género ya existe'
            });
        }

        // Crear género con transacción
        const nuevoGenero = await sequelize.transaction(async (t) => {
            return await Genero.create(
                { genero: genero.trim() },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Género creado exitosamente',
            data: nuevoGenero
        });
    } catch (error) {
        console.error('Error en generosPost:', error.message || error);
        return next(error);
    }
}

// Actualizar un genero por id
export const generoPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }

        const { genero } = req.body;

        // Validar que el campo genero no esté vacío
        if (!genero || (typeof genero === 'string' && genero.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'El campo genero es obligatorio'
            });
        }

        if (typeof genero !== 'string' || genero.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "genero" inválido' });
        }

        // Validar longitud máxima
        const attrs = Genero.rawAttributes || {};
        const maxLength = attrs.genero?.type?.options?.length ?? 10;
        if (String(genero).length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo genero no puede exceder ${maxLength} caracteres`
            });
        }

        // Verificar que el género existe
        const generoExistente = await Genero.findByPk(id);
        if (!generoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Género no encontrado'
            });
        }

        // Verificar si el nuevo género ya existe (y no es el mismo)
        if (genero.trim() !== generoExistente.genero) {
            const existe = await Genero.findOne({ where: { genero: genero.trim() } });
            if (existe) {
                return res.status(409).json({
                    success: false,
                    message: 'El género ya existe'
                });
            }
        }

        // Actualizar género con transacción
        const generoActualizado = await sequelize.transaction(async (t) => {
            await Genero.update(
                { genero: genero.trim() },
                { where: { id_genero: id }, transaction: t }
            );
            return await Genero.findByPk(id, { transaction: t });
        });

        return res.status(200).json({
            success: true,
            message: 'Género actualizado exitosamente',
            data: generoActualizado
        });
    } catch (error) {
        console.error('Error en generosPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente un genero por id
export const generoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { genero } = req.body;
        if (typeof genero === 'undefined') {
            return res.status(400).json({ success: false, message: 'Campo "genero" requerido' });
        }
        if (typeof genero !== 'string' || genero.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "genero" inválido' });
        }
        const value = genero.trim();

        // extraer longitud desde el modelo si existe
        const attrs = Genero.rawAttributes || {};
        const maxLength = attrs.genero?.type?.options?.length ?? 10;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo genero no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción (verifica existencia y unicidad)
        const updated = await sequelize.transaction(async (t) => {
            const record = await Genero.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.genero !== value) {
                const duplicate = await Genero.findOne({ where: { genero: value }, transaction: t });
                if (duplicate) {
                    const err = new Error('El género ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ genero: value }, { transaction: t });
            return await Genero.findByPk(id, { transaction: t });
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Género no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Género actualizado parcialmente',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en generosPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar un genero por id
export const generoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Genero.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Género no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Género eliminado correctamente',
            data: deleted
        });
    } catch (error) {
        // Manejo específico de FK constraint
        if (error.name === 'SequelizeForeignKeyConstraintError' || /foreign key|referenc/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el género: existen referencias en otras tablas'
            });
        }
        return next(error);
    }
}