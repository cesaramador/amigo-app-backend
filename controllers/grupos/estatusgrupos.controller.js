import EstatusGrupo from "../../models/grupos/estatusgrupo.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas las categorías de vivienda
export const estatusgruposGet = async (req, res, next) => {
    try {
        // Paginación y límites seguros
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        const q = (req.query.q || '').trim();
        const where = q ? { categoria_vivienda: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_estatusgrupo', sortOrderRaw = 'asc'] = (req.query.sort || 'id_estatusgrupo:asc').split(':');
        const allowedSortFields = ['id_estatusgrupo', 'nombre_estatus'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_estatusgrupo';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await EstatusGrupo.findAndCountAll({
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
        console.error('Error en estatusgruposGet:', error.message || error);
        return next(error);
    }
}

// Obtener una categoría de vivienda por ID
export const estatusgruposGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const categoria = await sequelize.transaction(async (t) => {
            return await EstatusGrupo.findByPk(id, { transaction: t });
        });

        if (!categoria) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, data: categoria });
    } catch (error) {
        console.error('Error en estatusgruposGetById:', error.message || error);
        return next(error);
    }
}

// Crear una nueva categoría de vivienda
export const estatusgrupoPost = async (req, res, next) => {
    try {
        const { estatus_grupo } = req.body;

        // Validación básica
        if (!estatus_grupo || typeof estatus_grupo !== 'string' || estatus_grupo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estatus_grupo es obligatorio' });
        }
        const value = estatus_grupo.trim();

        // Longitud desde el modelo (si está definida)
        const attrs = EstatusGrupo.rawAttributes || {};
        const maxLength = attrs.estatus_grupo?.type?.options?.length ?? attrs.estatus_grupo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_grupo no puede exceder ${maxLength} caracteres` });
        }

        // Verificar duplicado
        const exists = await EstatusGrupo.findOne({ where: { estatus_grupo: value } });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El estatus de grupo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await EstatusGrupo.create({ estatus_grupo: value }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Estatus de grupo creado exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en estatusgrupoPost:', error.message || error);
        return next(error);
    }
}

// Actualizar una categoría de vivienda por ID
export const estatusgrupoPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estatus_grupo } = req.body;
        if (!estatus_grupo || typeof estatus_grupo !== 'string' || estatus_grupo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo estatus_grupo es obligatorio' });
        }
        const value = estatus_grupo.trim();

        // obtener longitud máxima desde el modelo
        const attrs = EstatusGrupo.rawAttributes || {};
        const maxLength = attrs.estatus_grupo?.type?.options?.length ?? attrs.estatus_grupo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_grupo no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusGrupo.findByPk(id, { transaction: t });
            if (!record) return null;

            // comprobar duplicado (excluir el propio registro)
            const exists = await EstatusGrupo.findOne({
                where: { estatus_grupo: value, id_estatusgrupo: { [Op.ne]: id } },
                transaction: t
            });
            if (exists) {
                const err = new Error('El estatus de grupo ya existe');
                err.statusCode = 409;
                throw err;
            }

            await record.update({ estatus_grupo: value }, { transaction: t });
            return await EstatusGrupo.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Estatus de grupo actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error en estatusgrupoPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente una categoría de vivienda por ID
export const estatusgrupoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { estatus_grupo } = req.body;
        if (typeof estatus_grupo === 'undefined' || estatus_grupo === null) {
            return res.status(400).json({ success: false, message: 'Campo "estatus_grupo" requerido' });
        }
        if (typeof estatus_grupo !== 'string' || estatus_grupo.trim() === '') {
            return res.status(400).json({ success: false, message: 'Campo "estatus_grupo" inválido' });
        }

        const value = estatus_grupo.trim();
        const attrs = EstatusGrupo.rawAttributes || {};
        const maxLength = attrs.estatus_grupo?.type?.options?.length ?? attrs.estatus_grupo?._length ?? 20;
        if (value.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo estatus_grupo no puede exceder ${maxLength} caracteres` });
        }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await EstatusGrupo.findByPk(id, { transaction: t });
            if (!record) return null;

            if (record.estatus_grupo !== value) {
                const exists = await EstatusGrupo.findOne({
                    where: { estatus_grupo: value, id_estatusgrupo: { [Op.ne]: id } },
                    transaction: t
                });
                if (exists) {
                    const err = new Error('El estatus de grupo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({ estatus_grupo: value }, { transaction: t });
            return await EstatusGrupo.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Estatus de grupo actualizado parcialmente', data: updated });
    } catch (error) {
        console.error('Error en estatusgrupoPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar una categoría de vivienda por ID
export const estatusgrupoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Eliminar dentro de transacción
        const deleted = await sequelize.transaction(async (t) => {
            const record = await EstatusGrupo.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de grupo eliminado correctamente',
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
        console.error('Error en estatusgrupoDelete:', error.message || error);
        return next(error);
    }
}

