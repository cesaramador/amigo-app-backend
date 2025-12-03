import Estado from "../../models/usuarios/estados.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Leer todos los estados
export const estadosGet = async (req, res, next) => {
    try {
        // Paginación
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre
        const q = (req.query.q || '').trim();
        const where = q ? { estado: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_estado', sortOrderRaw = 'asc'] = (req.query.sort || 'id_estado:asc').split(':');
        const allowedSortFields = ['id_estado', 'estado'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estado';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Ejecutar consulta con transacción
        const estados = await sequelize.transaction(async (t) => {
            return await Estado.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortFieldSafe, sortOrder]],
                transaction: t
            });
        });

        const total = estados.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            message: 'Estados obtenidos exitosamente',
            meta: {
                total,
                page,
                pages,
                limit,
                sort: `${sortFieldSafe}:${sortOrder}`
            },
            data: estados.rows
        });
    } catch (error) {
        console.error('Error en estadosGet:', error.message || error);
        return next(error);
    }
}

// Leer un estado por id
export const estadoGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }

        // Buscar estado con transacción
        const estado = await sequelize.transaction(async (t) => {
            return await Estado.findByPk(id, { transaction: t });
        });

        if (!estado) {
            return res.status(404).json({
                success: false,
                message: 'Estado no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado obtenido exitosamente',
            data: estado
        });
    } catch (error) {
        console.error('Error en estadosGetById:', error.message || error);
        return next(error);
    }
}

// Crear un nuevo estado
export const estadoPost = async (req, res, next) => {
    try {
        const { estado } = req.body;

        // Validar que el campo estado no esté vacío
        if (!estado || (typeof estado === 'string' && estado.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'El campo estado es obligatorio'
            });
        }

        // Validar longitud máxima
        const attrs = Estado.rawAttributes || {};
        const maxLength = attrs.estado?.type?.options?.length ?? 100;
        if (String(estado).length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo estado no puede exceder ${maxLength} caracteres`
            });
        }

        // Verificar si el estado ya existe
        const existe = await Estado.findOne({ where: { estado: estado.trim() } });
        if (existe) {
            return res.status(409).json({
                success: false,
                message: 'El estado ya existe'
            });
        }

        // Crear estado con transacción
        const nuevoEstado = await sequelize.transaction(async (t) => {
            return await Estado.create(
                { estado: estado.trim() },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Estado creado exitosamente',
            data: nuevoEstado
        });
    } catch (error) {
        console.error('Error en estadosPost:', error.message || error);
        return next(error);
    }
}

// Actualizar un estado por id
export const estadoPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }

        const { estado } = req.body;

        // Validar que el campo estado no esté vacío
        if (!estado || (typeof estado === 'string' && estado.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'El campo estado es obligatorio'
            });
        }

        if (typeof estado !== 'string' || estado.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "estado" inválido' });
        }

        // Validar longitud máxima
        const attrs = Estado.rawAttributes || {};
        const maxLength = attrs.estado?.type?.options?.length ?? 100;
        if (String(estado).length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo estado no puede exceder ${maxLength} caracteres`
            });
        }

        // Verificar que el estado existe
        const estadoExistente = await Estado.findByPk(id);
        if (!estadoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Estado no encontrado'
            });
        }

        // Verificar si el nuevo estado ya existe (y no es el mismo)
        if (estado.trim() !== estadoExistente.estado) {
            const existe = await Estado.findOne({ where: { estado: estado.trim() } });
            if (existe) {
                return res.status(409).json({
                    success: false,
                    message: 'El estado ya existe'
                });
            }
        }

        // Actualizar género con transacción
        const estadoActualizado = await sequelize.transaction(async (t) => {
            await Estado.update(
                { estado: estado.trim() },
                { where: { id_estado: id }, transaction: t }
            );
            return await Estado.findByPk(id, { transaction: t });
        });

        return res.status(200).json({
            success: true,
            message: 'Estado actualizado exitosamente',
            data: estadoActualizado
        });
    } catch (error) {
        console.error('Error en estadosPut:', error.message || error);
        return next(error);
    }
}

// Actualizar un estado por id parcialmente
export const estadoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estado } = req.body;
        if (typeof estado === 'undefined') {
            return res.status(400).json({ success: false, message: 'Campo "estado" requerido' });
        }
        if (typeof estado !== 'string' || estado.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "estado" inválido' });
        }
        const value = estado.trim();

        // extraer longitud desde el modelo si existe
        const attrs = Estado.rawAttributes || {};
        const maxLength = attrs.estado?.type?.options?.length ?? 100;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estado no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción (verifica existencia y unicidad)
        const updated = await sequelize.transaction(async (t) => {
            const record = await Estado.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.estado !== value) {
                const duplicate = await Estado.findOne({ where: { estado: value }, transaction: t });
                if (duplicate) {
                    const err = new Error('El estado ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estado: value }, { transaction: t });
            return await Estado.findByPk(id, { transaction: t });
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Estado no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado actualizado parcialmente',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en estadosPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar un genero por id
export const estadoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Estado.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Estado no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado eliminado correctamente',
            data: deleted
        });
    } catch (error) {
        // Manejo específico de FK constraint
        if (error.name === 'SequelizeForeignKeyConstraintError' || /foreign key|referenc/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el estado: existen referencias en otras tablas'
            });
        }
        return next(error);
    }
}