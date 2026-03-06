import InscripcionesGrupos from "../../models/grupos/inscripcionesgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_inscripciongrupo', 'id_periodo_grupo', 'id_usuario_inscrito'];
const DEFAULT_SORT_FIELD  = 'id_inscripciongrupo';

// ─── Helper: validar entero positivo ─────────────────────────────────────────
const parsePositiveInt = (value) => {
    const n = parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /inscripcionesgrupos  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesgruposGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Filtros opcionales
        const where = {};

        if (req.query.id_periodo_grupo !== undefined) {
            const val = parsePositiveInt(req.query.id_periodo_grupo);
            if (val === null) {
                return res.status(400).json({ success: false, message: 'El parámetro id_periodo_grupo debe ser un entero positivo' });
            }
            where.id_periodo_grupo = val;
        }

        if (req.query.id_usuario_inscrito !== undefined) {
            const val = parsePositiveInt(req.query.id_usuario_inscrito);
            if (val === null) {
                return res.status(400).json({ success: false, message: 'El parámetro id_usuario_inscrito debe ser un entero positivo' });
            }
            where.id_usuario_inscrito = val;
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
export const inscripcionesgruposGetById = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

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
export const inscripcionesgruposPost = async (req, res, next) => {
    try {
        const { id_periodo_grupo, id_usuario_inscrito } = req.body;

        // Validar que ambos campos sean enteros positivos
        const idPeriodo  = parsePositiveInt(id_periodo_grupo);
        const idUsuario  = parsePositiveInt(id_usuario_inscrito);

        if (idPeriodo === null) {
            return res.status(400).json({ success: false, message: 'El campo id_periodo_grupo es obligatorio y debe ser un entero positivo' });
        }
        if (idUsuario === null) {
            return res.status(400).json({ success: false, message: 'El campo id_usuario_inscrito es obligatorio y debe ser un entero positivo' });
        }

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
export const inscripciongrupoPut = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { id_periodo_grupo, id_usuario_inscrito } = req.body;

        // Validar campos obligatorios
        const idPeriodo = parsePositiveInt(id_periodo_grupo);
        const idUsuario = parsePositiveInt(id_usuario_inscrito);

        if (idPeriodo === null) {
            return res.status(400).json({ success: false, message: 'El campo id_periodo_grupo es obligatorio y debe ser un entero positivo' });
        }
        if (idUsuario === null) {
            return res.status(400).json({ success: false, message: 'El campo id_usuario_inscrito es obligatorio y debe ser un entero positivo' });
        }

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
export const inscripciongrupoPatch = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { id_periodo_grupo, id_usuario_inscrito } = req.body;

        if (id_periodo_grupo === undefined && id_usuario_inscrito === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos uno de los campos: id_periodo_grupo, id_usuario_inscrito'
            });
        }

        // Validar cada campo si fue enviado
        let idPeriodo, idUsuario;

        if (id_periodo_grupo !== undefined) {
            idPeriodo = parsePositiveInt(id_periodo_grupo);
            if (idPeriodo === null) {
                return res.status(400).json({ success: false, message: 'El campo id_periodo_grupo debe ser un entero positivo' });
            }
        }

        if (id_usuario_inscrito !== undefined) {
            idUsuario = parsePositiveInt(id_usuario_inscrito);
            if (idUsuario === null) {
                return res.status(400).json({ success: false, message: 'El campo id_usuario_inscrito debe ser un entero positivo' });
            }
        }

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
export const inscripciongrupoDelete = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

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
