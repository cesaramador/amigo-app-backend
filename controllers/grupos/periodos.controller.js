import Periodos from "../../models/grupos/periodos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas los periodos de los grupos
export const periodosGet = async (req, res, next) => {
    try {
        // Paginación y límites seguros
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { periodo: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_periodo', sortOrderRaw = 'asc'] = (req.query.sort || 'id_periodo:asc').split(':');
        const allowedSortFields = ['id_periodo', 'periodo'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_periodo';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await Periodos.findAndCountAll({
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
        console.error('Error en periodosGet:', error.message || error);
        return next(error);
    }
}

// Obtener un periodo de grupo por ID
export const periodoGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const categoria = await sequelize.transaction(async (t) => {
            return await Periodos.findByPk(id, { transaction: t });
        });

        if (!categoria) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({ success: true, data: categoria });
    } catch (error) {
        console.error('Error en periodoGetById:', error.message || error);
        return next(error);
    }
}

// Crear un periodo de grupo
export const periodoPost = async (req, res, next) => {
    try {
        const { periodo, fecha_inicio, fecha_fin } = req.body;

        // Validación básica
        if (!periodo || typeof periodo !== 'string' || periodo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo periodo es obligatorio' });
        }

        // validación de capctura de fechas de inicio y fin (opcional)
        if (fecha_inicio && isNaN(Date.parse(fecha_inicio))) {
            return res.status(400).json({ success: false, message: 'El campo fecha_inicio debe ser una fecha válida' });
        }

        if (fecha_fin && isNaN(Date.parse(fecha_fin))) {
            return res.status(400).json({ success: false, message: 'El campo fecha_fin debe ser una fecha válida' });
        }

        // Longitud desde el modelo (si está definida)
        const attrs = Periodos.rawAttributes || {};
        const maxLength = attrs.periodo?.type?.options?.length ?? attrs.periodo?._length ?? 20;
        if (periodo.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo periodo no puede exceder ${maxLength} caracteres` });
        }

        // Verificar duplicado
        const exists_periodo = await Periodos.findOne({ where: { periodo: periodo } });
       
        if (exists_periodo) {
            return res.status(409).json({ success: false, message: 'El periodo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Periodos.create({ periodo, fecha_inicio, fecha_fin }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Periodo creado exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en periodosPost:', error.message || error);
        return next(error);
    }
}

// Actualizar un periodo por ID (PUT - requerido todos los campos principales)
export const periodoPut = async (req, res, next) => {
    try {
        const { periodo, fecha_inicio, fecha_fin } = req.body;

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Validar campo periodo (obligatorio)
        if (!periodo || typeof periodo !== 'string' || periodo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo periodo es obligatorio' });
        }
        const value = periodo.trim();

        // Obtener longitud máxima desde el modelo
        const attrs = Periodos.rawAttributes || {};
        const maxLength = attrs.periodo?.type?.options?.length ?? attrs.periodo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo periodo no puede exceder ${maxLength} caracteres` });
        }

        // Validar fechas opcionales
        if (fecha_inicio && isNaN(Date.parse(fecha_inicio))) {
            return res.status(400).json({ success: false, message: 'El campo fecha_inicio debe ser una fecha válida' });
        }
        if (fecha_fin && isNaN(Date.parse(fecha_fin))) {
            return res.status(400).json({ success: false, message: 'El campo fecha_fin debe ser una fecha válida' });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await Periodos.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado: si el periodo cambió, comprobar que no exista otro con el mismo valor
            if (value !== record.periodo) {
                const exists = await Periodos.findOne({
                    where: {
                        periodo: value,
                        id_periodo: { [Op.ne]: id }
                    },
                    transaction: t
                });

                if (exists) {
                    const err = new Error('El periodo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ periodo: value, fecha_inicio, fecha_fin }, { transaction: t });
            return await Periodos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Periodo actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error en periodoPut:', error.message || error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
}

// Actualizar parcialmente un periodo por ID (PATCH - campos opcionales)
export const periodoPatch = async (req, res, next) => {
    try {
        const { periodo, fecha_inicio, fecha_fin } = req.body;

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Validar campo periodo (obligatorio)
        if (!periodo || typeof periodo !== 'string' || periodo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo periodo es obligatorio' });
        }
        const value = periodo.trim();

        // Obtener longitud máxima desde el modelo
        const attrs = Periodos.rawAttributes || {};
        const maxLength = attrs.periodo?.type?.options?.length ?? attrs.periodo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo periodo no puede exceder ${maxLength} caracteres` });
        }

        // Validar fechas opcionales
        if (fecha_inicio && isNaN(Date.parse(fecha_inicio))) {
            return res.status(400).json({ success: false, message: 'El campo fecha_inicio debe ser una fecha válida' });
        }
        if (fecha_fin && isNaN(Date.parse(fecha_fin))) {
            return res.status(400).json({ success: false, message: 'El campo fecha_fin debe ser una fecha válida' });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await Periodos.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar duplicado: si el periodo cambió, comprobar que no exista otro con el mismo valor
            if (value !== record.periodo) {
                const exists = await Periodos.findOne({
                    where: {
                        periodo: value,
                        id_periodo: { [Op.ne]: id }
                    },
                    transaction: t
                });

                if (exists) {
                    const err = new Error('El periodo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ periodo: value, fecha_inicio, fecha_fin }, { transaction: t });
            return await Periodos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Periodo actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error en periodoPut:', error.message || error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
    }


// Eliminar una inscripción de grupo por ID
export const periodoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Eliminar dentro de transacción
        const deleted = await sequelize.transaction(async (t) => {
            const record = await Periodos.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Inscripción de grupo eliminada correctamente',
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
        console.error('Error en periodoDelete:', error.message || error);
        return next(error);
    }
}

