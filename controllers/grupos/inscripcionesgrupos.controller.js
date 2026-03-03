import InscripcionesGrupos from "../../models/grupos/inscripcionesgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas las inscripciones de los grupos
export const inscripcionesgruposGet = async (req, res, next) => {
    try {
        // Paginación y límites seguros
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto
        // const q = (req.query.q || '').trim();
        // const where = q ? { nombre_inscripcion: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_inscripciongrupo', sortOrderRaw = 'asc'] = (req.query.sort || 'id_inscripciongrupo:asc').split(':');
        const allowedSortFields = ['id_inscripciongrupo'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_inscripciongrupo';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Consulta dentro de transacción
        const result = await sequelize.transaction(async (t) => {
            return await InscripcionesGrupos.findAndCountAll({
                // where,
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
        console.error('Error en inscripcionesgruposGet:', error.message || error);
        return next(error);
    }
}

// Obtener una inscripción de grupo por ID
export const inscripcionesgruposGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const categoria = await sequelize.transaction(async (t) => {
            return await InscripcionesGrupos.findByPk(id, { transaction: t });
        });

        if (!categoria) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({ success: true, data: categoria });
    } catch (error) {
        console.error('Error en inscripcionesgruposGetById:', error.message || error);
        return next(error);
    }
}

// Crear una nueva inscripción de grupo
export const inscripcionesgruposPost = async (req, res, next) => {
    try {
        const { id_periodo_grupo, id_usuario_inscrito } = req.body;

        // Validación básica
        if (!id_periodo_grupo || !id_usuario_inscrito) {
            return res.status(400).json({ success: false, message: 'Los campos id_periodo_grupo e id_usuario_inscrito son obligatorios' });
        }
        // const value = estatus_grupo.trim();

        // Longitud desde el modelo (si está definida)
        // const attrs = CategoriasViviendas.rawAttributes || {};
        // const maxLength = attrs.estatus_grupo?.type?.options?.length ?? attrs.estatus_grupo?._length ?? 20;
        // if (value.length > maxLength) {
        //     return res.status(400).json({ success: false, message: `El campo estatus_grupo no puede exceder ${maxLength} caracteres` });
        // }

        // Verificar duplicado
        const exists_periodo = await InscripcionesGrupos.findOne({ where: { id_periodo_grupo: id_periodo_grupo } });
        const exists_usuario = await InscripcionesGrupos.findOne({ where: { id_usuario_inscrito: id_usuario_inscrito } });
        
        if (exists_periodo && exists_usuario) {
            return res.status(409).json({ success: false, message: 'El usuario ya está inscrito en este periodo de grupo' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await InscripcionesGrupos.create({ id_periodo_grupo, id_usuario_inscrito }, { transaction: t });
        });

        return res.status(201).json({ success: true, message: 'Inscripción de grupo creada exitosamente', data: nuevo });
    } catch (error) {
        console.error('Error en inscripcionesgruposPost:', error.message || error);
        return next(error);
    }
}

// Actualizar una inscripción de grupo por ID
export const inscripciongrupoPut = async (req, res, next) => {
    try {

        const { id_periodo_grupo, id_usuario_inscrito } = req.body;

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // const { estatus_grupo } = req.body;
        // if (!estatus_grupo || typeof estatus_grupo !== 'string' || estatus_grupo.trim() === '') {
        //     return res.status(400).json({ success: false, message: 'El campo estatus_grupo es obligatorio' });
        // }
        // const value = estatus_grupo.trim();

        // obtener longitud máxima desde el modelo
        // const attrs = CategoriasViviendas.rawAttributes || {};
        // const maxLength = attrs.estatus_grupo?.type?.options?.length ?? attrs.estatus_grupo?._length ?? 20;
        // if (value.length > maxLength) {
        //     return res.status(400).json({ success: false, message: `El campo estatus_grupo no puede exceder ${maxLength} caracteres` });
        // }

        // Actualizar dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await InscripcionesGrupos.findByPk(id, { transaction: t });
            if (!record) return null;

            // comprobar duplicado (excluir el propio registro)
            const exists_periodo = await InscripcionesGrupos.findOne({ where: { id_periodo_grupo: id_periodo_grupo } });
            const exists_usuario = await InscripcionesGrupos.findOne({ where: { id_usuario_inscrito: id_usuario_inscrito } });
        
        if (exists_periodo && exists_usuario) {
            return res.status(409).json({ success: false, message: 'El usuario ya está inscrito en este periodo de grupo' });
        }

            await record.update({ id_periodo_grupo, id_usuario_inscrito }, { transaction: t });
            return await InscripcionesGrupos.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Inscripción de grupo actualizada exitosamente', data: updated });
    } catch (error) {
        console.error('Error en inscripciongrupoPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente una inscripción de grupo por ID
export const inscripciongrupoPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { id_periodo_grupo, id_usuario_inscrito } = req.body;
        if (id_periodo_grupo === undefined && id_usuario_inscrito === undefined) {
            return res.status(400).json({ success: false, message: 'Al menos un campo debe ser proporcionado para la actualización' });
        }

        // Realizar la actualización dentro de una transacción para mayor seguridad
        const updated = await sequelize.transaction(async (t) => {
            const record = await InscripcionesGrupos.findByPk(id, { transaction: t });
            if (!record) return null;

            // Determinar nuevos valores (mantener los existentes cuando no se provean)
            const newPeriodo = id_periodo_grupo !== undefined ? id_periodo_grupo : record.id_periodo_grupo;
            const newUsuario = id_usuario_inscrito !== undefined ? id_usuario_inscrito : record.id_usuario_inscrito;

            // Si hubo algún cambio significativo, verificar que no se genere un duplicado
            if (newPeriodo !== record.id_periodo_grupo || newUsuario !== record.id_usuario_inscrito) {
                const exists = await InscripcionesGrupos.findOne({
                    where: {
                        id_periodo_grupo: newPeriodo,
                        id_usuario_inscrito: newUsuario,
                        id_inscripciongrupo: { [Op.ne]: id }
                    },
                    transaction: t
                });

                if (exists) {
                    const err = new Error('El usuario ya está inscrito en este periodo de grupo');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await record.update({
                id_periodo_grupo: newPeriodo,
                id_usuario_inscrito: newUsuario
            }, { transaction: t });

            return record;
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Inscripción de grupo actualizada parcialmente',
            data: updated
        });
    } catch (error) {
        console.error('Error en inscripciongrupoPatch:', error.message || error);
        // manejar errores generados manualmente
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
}

// Eliminar una inscripción de grupo por ID
export const inscripciongrupoDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Eliminar dentro de transacción
        const deleted = await sequelize.transaction(async (t) => {
            const record = await InscripcionesGrupos.findByPk(id, { transaction: t });
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
        console.error('Error en inscripciongrupoDelete:', error.message || error);
        return next(error);
    }
}

