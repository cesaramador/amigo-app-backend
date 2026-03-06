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

// ─── Utilidad: valida que un string sea una fecha ISO 8601 parseable ──────────
const isValidDate = (value) => {
    if (!value || typeof value !== 'string') return false;
    const d = new Date(value);
    return !isNaN(d.getTime());
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /usuariosencuestas  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosencuestasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const where = {};

        // Filtro opcional por id_usuario
        if (req.query.id_usuario !== undefined) {
            const idUsr = parseInt(req.query.id_usuario, 10);
            if (!Number.isInteger(idUsr) || idUsr <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro id_usuario debe ser un entero positivo'
                });
            }
            where.id_usuario = idUsr;
        }

        // Filtro opcional por id_encuesta
        if (req.query.id_encuesta !== undefined) {
            const idEnc = parseInt(req.query.id_encuesta, 10);
            if (!Number.isInteger(idEnc) || idEnc <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro id_encuesta debe ser un entero positivo'
                });
            }
            where.id_encuesta = idEnc;
        }

        // Filtro opcional por rango de fechas
        if (req.query.fecha_desde || req.query.fecha_hasta) {
            const fechaWhere = {};
            if (req.query.fecha_desde) {
                if (!isValidDate(req.query.fecha_desde)) {
                    return res.status(400).json({
                        success: false,
                        message: 'El parámetro fecha_desde no es una fecha válida'
                    });
                }
                fechaWhere[Op.gte] = new Date(req.query.fecha_desde);
            }
            if (req.query.fecha_hasta) {
                if (!isValidDate(req.query.fecha_hasta)) {
                    return res.status(400).json({
                        success: false,
                        message: 'El parámetro fecha_hasta no es una fecha válida'
                    });
                }
                fechaWhere[Op.lte] = new Date(req.query.fecha_hasta);
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
export const usuariosencuestasGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

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
export const usuariosencuestasPost = async (req, res, next) => {
    try {
        const { id_usuario, id_encuesta, fecha_elaboracion_encuesta } = req.body;

        // ── Validación: id_usuario ───────────────────────────────────────────
        const idUsr = parseInt(id_usuario, 10);
        if (!Number.isInteger(idUsr) || idUsr <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_usuario debe ser un entero positivo'
            });
        }

        // ── Validación: id_encuesta ──────────────────────────────────────────
        const idEnc = parseInt(id_encuesta, 10);
        if (!Number.isInteger(idEnc) || idEnc <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_encuesta debe ser un entero positivo'
            });
        }

        // ── Validación: fecha_elaboracion_encuesta ───────────────────────────
        if (!isValidDate(fecha_elaboracion_encuesta)) {
            return res.status(400).json({
                success: false,
                message: 'El campo fecha_elaboracion_encuesta es obligatorio y debe ser una fecha válida (ISO 8601)'
            });
        }
        const fechaVal = new Date(fecha_elaboracion_encuesta);

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
export const usuariosencuestasPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { id_usuario, id_encuesta, fecha_elaboracion_encuesta } = req.body;

        // ── Validaciones ─────────────────────────────────────────────────────
        const idUsr = parseInt(id_usuario, 10);
        if (!Number.isInteger(idUsr) || idUsr <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_usuario debe ser un entero positivo'
            });
        }

        const idEnc = parseInt(id_encuesta, 10);
        if (!Number.isInteger(idEnc) || idEnc <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_encuesta debe ser un entero positivo'
            });
        }

        if (!isValidDate(fecha_elaboracion_encuesta)) {
            return res.status(400).json({
                success: false,
                message: 'El campo fecha_elaboracion_encuesta es obligatorio y debe ser una fecha válida (ISO 8601)'
            });
        }
        const fechaVal = new Date(fecha_elaboracion_encuesta);

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
export const usuariosencuestasPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { id_usuario, id_encuesta, fecha_elaboracion_encuesta } = req.body;

        // Al menos un campo debe venir en el body
        if (
            id_usuario                  === undefined &&
            id_encuesta                 === undefined &&
            fecha_elaboracion_encuesta  === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo: id_usuario, id_encuesta, fecha_elaboracion_encuesta'
            });
        }

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (id_usuario !== undefined) {
            const idUsr = parseInt(id_usuario, 10);
            if (!Number.isInteger(idUsr) || idUsr <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_usuario debe ser un entero positivo'
                });
            }
            updates.id_usuario = idUsr;
        }

        if (id_encuesta !== undefined) {
            const idEnc = parseInt(id_encuesta, 10);
            if (!Number.isInteger(idEnc) || idEnc <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_encuesta debe ser un entero positivo'
                });
            }
            updates.id_encuesta = idEnc;
        }

        if (fecha_elaboracion_encuesta !== undefined) {
            if (!isValidDate(fecha_elaboracion_encuesta)) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo fecha_elaboracion_encuesta debe ser una fecha válida (ISO 8601)'
                });
            }
            updates.fecha_elaboracion_encuesta = new Date(fecha_elaboracion_encuesta);
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
export const usuariosencuestasDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

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
