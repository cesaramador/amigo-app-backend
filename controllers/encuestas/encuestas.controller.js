import Encuestas from "../../models/encuestas/encuestas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Helper: parsear entero positivo ─────────────────────────────────────────
const parsePositiveInt = (value) => {
    const n = parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_encuesta', 'nombre_encuesta', 'id_tipo_encuesta', 'id_estatus_enc_preg_resp'
];
const DEFAULT_SORT_FIELD = 'id_encuesta';

// ─────────────────────────────────────────────────────────────────────────────
// GET /encuestas  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const encuestasGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto en nombre_encuesta
        const where = {};
        const q = (req.query.q || '').trim();
        if (q) where.nombre_encuesta = { [Op.like]: `%${q}%` };

        // Filtros opcionales por clave foránea
        const fkFilters = ['id_tipo_encuesta', 'id_estatus_enc_preg_resp'];
        for (const field of fkFilters) {
            if (req.query[field] !== undefined) {
                const val = parsePositiveInt(req.query[field]);
                if (val === null) {
                    return res.status(400).json({
                        success: false,
                        message: `El parámetro ${field} debe ser un entero positivo`
                    });
                }
                where[field] = val;
            }
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await Encuestas.findAndCountAll({
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
        console.error('[encuestasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /encuestas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const encuestaGetById = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        // Lectura simple: sin transacción explícita
        const registro = await Encuestas.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[encuestaGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /encuestas  →  crear nueva encuesta
// ─────────────────────────────────────────────────────────────────────────────
export const encuestaPost = async (req, res, next) => {
    try {
        const { nombre_encuesta, id_tipo_encuesta, id_estatus_enc_preg_resp } = req.body;

        // Validar nombre_encuesta (obligatorio)
        if (!nombre_encuesta || typeof nombre_encuesta !== 'string' || nombre_encuesta.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo nombre_encuesta es obligatorio' });
        }
        const nombreValue = nombre_encuesta.trim();

        // Longitud máxima obtenida del modelo
        const attrs     = Encuestas.rawAttributes || {};
        const maxLength = attrs.nombre_encuesta?.type?.options?.length
                       ?? attrs.nombre_encuesta?._length
                       ?? 500;
        if (nombreValue.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo nombre_encuesta no puede exceder ${maxLength} caracteres`
            });
        }

        // Validar claves foráneas obligatorias
        const idTipoEncuesta          = parsePositiveInt(id_tipo_encuesta);
        const idEstatusEncPregResp    = parsePositiveInt(id_estatus_enc_preg_resp);

        if (idTipoEncuesta === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_tipo_encuesta es obligatorio y debe ser un entero positivo'
            });
        }
        if (idEstatusEncPregResp === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_estatus_enc_preg_resp es obligatorio y debe ser un entero positivo'
            });
        }

        // Verificar duplicado de nombre para el mismo tipo de encuesta
        const existe = await Encuestas.findOne({
            where: { nombre_encuesta: nombreValue, id_tipo_encuesta: idTipoEncuesta }
        });
        if (existe) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una encuesta con ese nombre para el mismo tipo de encuesta'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Encuestas.create(
                {
                    nombre_encuesta:          nombreValue,
                    id_tipo_encuesta:         idTipoEncuesta,
                    id_estatus_enc_preg_resp: idEstatusEncPregResp
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Encuesta creada exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[encuestaPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /encuestas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const encuestaPut = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { nombre_encuesta, id_tipo_encuesta, id_estatus_enc_preg_resp } = req.body;

        // Validar nombre_encuesta (obligatorio en PUT)
        if (!nombre_encuesta || typeof nombre_encuesta !== 'string' || nombre_encuesta.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo nombre_encuesta es obligatorio' });
        }
        const nombreValue = nombre_encuesta.trim();

        const attrs     = Encuestas.rawAttributes || {};
        const maxLength = attrs.nombre_encuesta?.type?.options?.length
                       ?? attrs.nombre_encuesta?._length
                       ?? 500;
        if (nombreValue.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo nombre_encuesta no puede exceder ${maxLength} caracteres`
            });
        }

        const idTipoEncuesta       = parsePositiveInt(id_tipo_encuesta);
        const idEstatusEncPregResp = parsePositiveInt(id_estatus_enc_preg_resp);

        if (idTipoEncuesta === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_tipo_encuesta es obligatorio y debe ser un entero positivo'
            });
        }
        if (idEstatusEncPregResp === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_estatus_enc_preg_resp es obligatorio y debe ser un entero positivo'
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Encuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de nombre+tipo si alguno cambió
            if (
                nombreValue !== registro.nombre_encuesta ||
                idTipoEncuesta !== registro.id_tipo_encuesta
            ) {
                const duplicado = await Encuestas.findOne({
                    where: {
                        nombre_encuesta:  nombreValue,
                        id_tipo_encuesta: idTipoEncuesta,
                        id_encuesta:      { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una encuesta con ese nombre para el mismo tipo de encuesta');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(
                {
                    nombre_encuesta:          nombreValue,
                    id_tipo_encuesta:         idTipoEncuesta,
                    id_estatus_enc_preg_resp: idEstatusEncPregResp
                },
                { transaction: t }
            );
            return await Encuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Encuesta actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[encuestaPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /encuestas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const encuestaPatch = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const camposPermitidos = ['nombre_encuesta', 'id_tipo_encuesta', 'id_estatus_enc_preg_resp'];
        const camposRecibidos  = Object.keys(req.body).filter(k => camposPermitidos.includes(k));

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Se requiere al menos uno de los campos: ${camposPermitidos.join(', ')}`
            });
        }

        // Construir objeto de cambios validados
        const cambios = {};

        if ('nombre_encuesta' in req.body) {
            const raw = req.body.nombre_encuesta;
            if (!raw || typeof raw !== 'string' || raw.trim() === '') {
                return res.status(400).json({ success: false, message: 'El campo nombre_encuesta no es válido' });
            }
            const trimmed = raw.trim();
            const attrs     = Encuestas.rawAttributes || {};
            const maxLength = attrs.nombre_encuesta?.type?.options?.length
                           ?? attrs.nombre_encuesta?._length
                           ?? 500;
            if (trimmed.length > maxLength) {
                return res.status(400).json({
                    success: false,
                    message: `El campo nombre_encuesta no puede exceder ${maxLength} caracteres`
                });
            }
            cambios.nombre_encuesta = trimmed;
        }

        if ('id_tipo_encuesta' in req.body) {
            const val = parsePositiveInt(req.body.id_tipo_encuesta);
            if (val === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_tipo_encuesta debe ser un entero positivo'
                });
            }
            cambios.id_tipo_encuesta = val;
        }

        if ('id_estatus_enc_preg_resp' in req.body) {
            const val = parsePositiveInt(req.body.id_estatus_enc_preg_resp);
            if (val === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_estatus_enc_preg_resp debe ser un entero positivo'
                });
            }
            cambios.id_estatus_enc_preg_resp = val;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Encuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de nombre+tipo si alguno de esos campos cambia
            if ('nombre_encuesta' in cambios || 'id_tipo_encuesta' in cambios) {
                const nombreFinal = 'nombre_encuesta'  in cambios ? cambios.nombre_encuesta  : registro.nombre_encuesta;
                const tipoFinal   = 'id_tipo_encuesta' in cambios ? cambios.id_tipo_encuesta : registro.id_tipo_encuesta;

                const duplicado = await Encuestas.findOne({
                    where: {
                        nombre_encuesta:  nombreFinal,
                        id_tipo_encuesta: tipoFinal,
                        id_encuesta:      { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe una encuesta con ese nombre para el mismo tipo de encuesta');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await Encuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Encuesta actualizada parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('[encuestaPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /encuestas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const encuestaDelete = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Encuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            message: 'Encuesta eliminada correctamente',
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
                message: 'No se puede eliminar: la encuesta está referenciada en otras tablas'
            });
        }
        console.error('[encuestaDelete]', error.message || error);
        return next(error);
    }
};
