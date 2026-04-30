import InscripcionesGrupos from "../../models/grupos/inscripcionesgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_inscripciongrupo', 'id_periodo_grupo', 'id_usuario_inscrito'];
const DEFAULT_SORT_FIELD  = 'id_inscripciongrupo';

// ─────────────────────────────────────────────────────────────────────────────
// GET /inscripcionesgrupos  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgruposGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Filtros opcionales
        const where = {};

        if (req.query.id_periodo_grupo !== undefined) {
            where.id_periodo_grupo = req.query.id_periodo_grupo;
        }

        if (req.query.id_usuario_inscrito !== undefined) {
            where.id_usuario_inscrito = req.query.id_usuario_inscrito;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await InscripcionesGrupos.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortFieldSafe, sortOrder]]
        });

        const total = count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: rows
        });
    } catch (error) {
        console.error('[inscripcionesgruposGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /inscripcionesgrupos/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgrupoGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const registro = await InscripcionesGrupos.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[inscripcionesgruposGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /inscripcionesgrupos  →  crear nueva inscripción
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgrupoPost = async (req, res, next) => {
    try {
        const { id_periodo_grupo, id_usuario_inscrito } = req.body;
        const idPeriodo = id_periodo_grupo;
        const idUsuario = id_usuario_inscrito;

        // Verificar duplicado: la combinación (id_periodo_grupo + id_usuario_inscrito) debe ser única
        const existe = await InscripcionesGrupos.findOne({
            where: { id_periodo_grupo: idPeriodo, id_usuario_inscrito: idUsuario }
        });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El usuario ya está inscrito en este periodo de grupo' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await InscripcionesGrupos.create(
                { id_periodo_grupo: idPeriodo, id_usuario_inscrito: idUsuario },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Inscripción de grupo creada exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[inscripcionesgruposPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /inscripcionesgrupos/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgrupoPut = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id_periodo_grupo, id_usuario_inscrito } = req.body;
        const idPeriodo = id_periodo_grupo;
        const idUsuario = id_usuario_inscrito;

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await InscripcionesGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de la combinación (excluir el propio registro)
            const duplicado = await InscripcionesGrupos.findOne({
                where: {
                    id_periodo_grupo: idPeriodo,
                    id_usuario_inscrito: idUsuario,
                    id_inscripciongrupo: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El usuario ya está inscrito en este periodo de grupo');
                err.statusCode = 409;
                throw err;
            }

            await registro.update({ id_periodo_grupo: idPeriodo, id_usuario_inscrito: idUsuario }, { transaction: t });
            return await InscripcionesGrupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Inscripción de grupo actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[inscripciongrupoPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /inscripcionesgrupos/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgrupoPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { id_periodo_grupo, id_usuario_inscrito } = req.body;
        const idPeriodo = id_periodo_grupo;
        const idUsuario = id_usuario_inscrito;

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await InscripcionesGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Resolver valores finales (los recibidos o los existentes)
            const idPeriodoFinal = idPeriodo  ?? registro.id_periodo_grupo;
            const idUsuarioFinal = idUsuario  ?? registro.id_usuario_inscrito;

            // Verificar duplicado solo si la clave compuesta cambia
            const cambiaClave =
                idPeriodoFinal !== registro.id_periodo_grupo ||
                idUsuarioFinal !== registro.id_usuario_inscrito;

            if (cambiaClave) {
                const duplicado = await InscripcionesGrupos.findOne({
                    where: {
                        id_periodo_grupo:    idPeriodoFinal,
                        id_usuario_inscrito: idUsuarioFinal,
                        id_inscripciongrupo: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El usuario ya está inscrito en este periodo de grupo');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(
                { id_periodo_grupo: idPeriodoFinal, id_usuario_inscrito: idUsuarioFinal },
                { transaction: t }
            );

            // Recargar desde BD para retornar estado persistido
            return await InscripcionesGrupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Inscripción de grupo actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[inscripciongrupoPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /inscripcionesgrupos/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgrupoDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await InscripcionesGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Inscripción de grupo no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Inscripción de grupo eliminada correctamente',
            data: eliminado
        });
    } catch (error) {
        // Integridad referencial
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: la inscripción está referenciada en otras tablas'
            });
        }
        console.error('[inscripciongrupoDelete]', error.message || error);
        return next(error);
    }
};
