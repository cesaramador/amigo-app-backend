import UsuariosEncuestas from "../../models/encuestas/usuariosencuestas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_usuario_encuesta',
    'id_usuario',
    'id_encuesta',
    'fecha_elaboracion_encuesta'
];
const DEFAULT_SORT_FIELD = 'id_usuario_encuesta';

// ─────────────────────────────────────────────────────────────────────────────
// GET /usuariosencuestas  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestasGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        const where = {};

        // Filtro opcional por id_usuario
        if (req.query.id_usuario !== undefined) {
            where.id_usuario = req.query.id_usuario;
        }

        // Filtro opcional por id_encuesta
        if (req.query.id_encuesta !== undefined) {
            where.id_encuesta = req.query.id_encuesta;
        }

        // Filtro opcional por rango de fechas
        if (req.query.fecha_desde || req.query.fecha_hasta) {
            const fechaWhere = {};
            if (req.query.fecha_desde) {
                fechaWhere[Op.gte] = req.query.fecha_desde;
            }
            if (req.query.fecha_hasta) {
                fechaWhere[Op.lte] = req.query.fecha_hasta;
            }
            where.fecha_elaboracion_encuesta = fechaWhere;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await UsuariosEncuestas.findAndCountAll({
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
        console.error('[usuariosencuestasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /usuariosencuestas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestaGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const registro = await UsuariosEncuestas.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Registro de usuario-encuesta no encontrado'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[usuariosencuestasGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /usuariosencuestas  →  crear nuevo registro de usuario-encuesta
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestaPost = async (req, res, next) => {
    try {
        const { id_usuario, id_encuesta, fecha_elaboracion_encuesta } = req.body;
        const idUsr = id_usuario;
        const idEnc = id_encuesta;
        const fechaVal = fecha_elaboracion_encuesta;

        // Verificar duplicado: combinación única id_usuario + id_encuesta
        const exists = await UsuariosEncuestas.findOne({
            where: { id_usuario: idUsr, id_encuesta: idEnc }
        });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'El usuario ya tiene registrada esa encuesta'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await UsuariosEncuestas.create(
                {
                    id_usuario:                idUsr,
                    id_encuesta:               idEnc,
                    fecha_elaboracion_encuesta: fechaVal
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Registro de usuario-encuesta creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[usuariosencuestasPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /usuariosencuestas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestaPut = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { id_usuario, id_encuesta, fecha_elaboracion_encuesta } = req.body;
        const idUsr = id_usuario;
        const idEnc = id_encuesta;
        const fechaVal = fecha_elaboracion_encuesta;

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await UsuariosEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de combinación (excluir el propio registro)
            const duplicado = await UsuariosEncuestas.findOne({
                where: {
                    id_usuario:          idUsr,
                    id_encuesta:         idEnc,
                    id_usuario_encuesta: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El usuario ya tiene registrada esa encuesta');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    id_usuario:                idUsr,
                    id_encuesta:               idEnc,
                    fecha_elaboracion_encuesta: fechaVal
                },
                { transaction: t }
            );
            return await UsuariosEncuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Registro de usuario-encuesta no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Registro de usuario-encuesta actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[usuariosencuestasPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /usuariosencuestas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestaPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { id_usuario, id_encuesta, fecha_elaboracion_encuesta } = req.body;

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (id_usuario !== undefined) {
            updates.id_usuario = id_usuario;
        }

        if (id_encuesta !== undefined) {
            updates.id_encuesta = id_encuesta;
        }

        if (fecha_elaboracion_encuesta !== undefined) {
            updates.fecha_elaboracion_encuesta = fecha_elaboracion_encuesta;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await UsuariosEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Si se modifica id_usuario o id_encuesta, verificar duplicado de combinación
            const usuarioFinal  = updates.id_usuario  ?? registro.id_usuario;
            const encuestaFinal = updates.id_encuesta ?? registro.id_encuesta;

            if (updates.id_usuario !== undefined || updates.id_encuesta !== undefined) {
                const duplicado = await UsuariosEncuestas.findOne({
                    where: {
                        id_usuario:          usuarioFinal,
                        id_encuesta:         encuestaFinal,
                        id_usuario_encuesta: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El usuario ya tiene registrada esa encuesta');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(updates, { transaction: t });
            return await UsuariosEncuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Registro de usuario-encuesta no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Registro de usuario-encuesta actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[usuariosencuestasPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /usuariosencuestas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestaDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await UsuariosEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Registro de usuario-encuesta no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Registro de usuario-encuesta eliminado correctamente',
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
                message: 'No se puede eliminar: el registro está referenciado en otras tablas'
            });
        }
        console.error('[usuariosencuestasDelete]', error.message || error);
        return next(error);
    }
};
