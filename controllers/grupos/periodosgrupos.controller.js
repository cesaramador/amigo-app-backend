import PeriodosGrupos from "../../models/grupos/periodosgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas los periodos con sus grupos
export const periodosgruposGet = async (req, res, next) => {
    try {
        // Paginación y límites seguros
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        // const q = (req.query.q || '').trim();
        // const where = q ? { periodo: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_periodogrupo', sortOrderRaw = 'asc'] = (req.query.sort || 'id_periodogrupo:asc').split(':');
        const allowedSortFields = ['id_periodogrupo'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_periodogrupo';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await PeriodosGrupos.findAndCountAll({
                //where,
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

// Obtener un periodo de un grupo por ID
export const periodogrupoGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const periodogrupo = await sequelize.transaction(async (t) => {
            return await PeriodosGrupos.findByPk(id, { transaction: t });
        });

        if (!periodogrupo) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({ success: true, data: periodogrupo });
    } catch (error) {
        console.error('Error en periodogrupoGetById:', error.message || error);
        return next(error);
    }
}

// Crear un periodo de un grupo
export const periodogrupoPost = async (req, res, next) => {
    try {
        const { id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo } = req.body;

        // Validación básica
        if (!id_grupo || !Number.isInteger(id_grupo) || id_grupo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_grupo es obligatorio y debe ser un número entero positivo' });
        }

        if (!id_periodo || !Number.isInteger(id_periodo) || id_periodo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_periodo es obligatorio y debe ser un número entero positivo' });
        }

        if (!id_estatus_grupo || !Number.isInteger(id_estatus_grupo) || id_estatus_grupo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_estatus_grupo es obligatorio y debe ser un número entero positivo' });
        }

        if (!id_responsable_grupo || !Number.isInteger(id_responsable_grupo) || id_responsable_grupo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_responsable_grupo es obligatorio y debe ser un número entero positivo' });
        }

        // validación de capctura de fechas de inicio y fin (opcional)
        // if (fecha_inicio && isNaN(Date.parse(fecha_inicio))) {
        //     return res.status(400).json({ success: false, message: 'El campo fecha_inicio debe ser una fecha válida' });
        // }

        // if (fecha_fin && isNaN(Date.parse(fecha_fin))) {
        //     return res.status(400).json({ success: false, message: 'El campo fecha_fin debe ser una fecha válida' });
        // }

        // Longitud desde el modelo (si está definida)
        // const attrs = PeriodosGrupos.rawAttributes || {};
        // const maxLength = attrs.periodo?.type?.options?.length ?? attrs.periodo?._length ?? 20;
        // if (periodo.length > maxLength) {
        //     return res.status(400).json({ success: false, message: `El campo periodo no puede exceder ${maxLength} caracteres` });
        // }

        // Verificar duplicado
        const exists_periodo = await PeriodosGrupos.findOne({ where: { id_grupo: id_grupo, 
                                                                        id_periodo: id_periodo, 
                                                                        id_estatus_grupo: id_estatus_grupo, 
                                                                        id_responsable_grupo: id_responsable_grupo } });
       
        if (exists_periodo) {
            return res.status(409).json({ success: false, message: 'El periodo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await PeriodosGrupos.create({ id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Periodo creado exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en periodosPost:', error.message || error);
        return next(error);
    }
}

// Actualizar un periodo de grupo por ID (PUT - requiere todos los campos principales)
export const periodogrupoPut = async (req, res, next) => {
    try {
        const { id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo } = req.body;

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Validaciones de campos obligatorios y tipos
        if (!id_grupo || !Number.isInteger(id_grupo) || id_grupo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_grupo es obligatorio y debe ser un entero positivo' });
        }
        if (!id_periodo || !Number.isInteger(id_periodo) || id_periodo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_periodo es obligatorio y debe ser un entero positivo' });
        }
        if (!id_estatus_grupo || !Number.isInteger(id_estatus_grupo) || id_estatus_grupo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_estatus_grupo es obligatorio y debe ser un entero positivo' });
        }
        if (!id_responsable_grupo || !Number.isInteger(id_responsable_grupo) || id_responsable_grupo <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_responsable_grupo es obligatorio y debe ser un entero positivo' });
        }

        // Actualizar dentro de una transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await PeriodosGrupos.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar que la combinación no se duplique en otro registro distinto
            const exists = await PeriodosGrupos.findOne({
                where: {
                    id_grupo,
                    id_periodo,
                    id_estatus_grupo,
                    id_responsable_grupo,
                    id_periodogrupo: { [Op.ne]: id }
                },
                transaction: t
            });
            if (exists) {
                const err = new Error('Ya existe un periodo de grupo con los mismos datos');
                err.statusCode = 409;
                throw err;
            }

            await record.update({ id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo }, { transaction: t });
            return await PeriodosGrupos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Periodo de grupo actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error en periodogrupoPut:', error.message || error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
}

// Actualizar parcialmente un periodo de grupo por ID (PATCH - campos opcionales)
export const periodogrupoPatch = async (req, res, next) => {
    try {
        const { id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo } = req.body;

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Build update object with only valid fields
        const updates = {};
        if (id_grupo !== undefined) {
            if (!Number.isInteger(id_grupo) || id_grupo <= 0) {
                return res.status(400).json({ success: false, message: 'El campo id_grupo debe ser un entero positivo' });
            }
            updates.id_grupo = id_grupo;
        }
        if (id_periodo !== undefined) {
            if (!Number.isInteger(id_periodo) || id_periodo <= 0) {
                return res.status(400).json({ success: false, message: 'El campo id_periodo debe ser un entero positivo' });
            }
            updates.id_periodo = id_periodo;
        }
        if (id_estatus_grupo !== undefined) {
            if (!Number.isInteger(id_estatus_grupo) || id_estatus_grupo <= 0) {
                return res.status(400).json({ success: false, message: 'El campo id_estatus_grupo debe ser un entero positivo' });
            }
            updates.id_estatus_grupo = id_estatus_grupo;
        }
        if (id_responsable_grupo !== undefined) {
            if (!Number.isInteger(id_responsable_grupo) || id_responsable_grupo <= 0) {
                return res.status(400).json({ success: false, message: 'El campo id_responsable_grupo debe ser un entero positivo' });
            }
            updates.id_responsable_grupo = id_responsable_grupo;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No se proporcionó ningún campo válido para actualizar' });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await PeriodosGrupos.findByPk(id, { transaction: t });
            if (!record) return null;

            // Si se cambian todos los campos principales, verificar duplicado
            const dupCheckFields = ['id_grupo', 'id_periodo', 'id_estatus_grupo', 'id_responsable_grupo'];
            if (dupCheckFields.every(f => updates[f] !== undefined)) {
                const exists = await PeriodosGrupos.findOne({
                    where: {
                        ...updates,
                        id_periodogrupo: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('Ya existe un periodo de grupo con los mismos datos');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update(updates, { transaction: t });
            return await PeriodosGrupos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Periodo de grupo actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error en periodogrupoPatch:', error.message || error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
}


// Eliminar un periodo de grupo por ID
export const periodogrupoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Eliminar dentro de transacción
        const deleted = await sequelize.transaction(async (t) => {
            const record = await PeriodosGrupos.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo de grupo eliminado correctamente',
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
        console.error('Error en periodogrupoDelete:', error.message || error);
        return next(error);
    }
}

