import TipoEncuestas from "../../models/encuestas/tipoencuestas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_tipoencuesta', 'tipo_encuesta'];
const DEFAULT_SORT_FIELD  = 'id_tipoencuesta';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
// const MAX_TIPO_ENCUESTA = 50;

// ─────────────────────────────────────────────────────────────────────────────
// GET /tipoencuestas  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const tipoencuestasGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo tipo_encuesta
        const q     = (req.query.q || '').trim();
        const where = q ? { tipo_encuesta: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await TipoEncuestas.findAndCountAll({
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
        console.error('[tipoencuestasGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /tipoencuestas/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const tipoencuestaGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const registro = await TipoEncuestas.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de encuesta no encontrado'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[tipoencuestasGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /tipoencuestas  →  crear nuevo tipo de encuesta
// ─────────────────────────────────────────────────────────────────────────────
export const tipoencuestaPost = async (req, res, next) => {
    try {
        const { tipo_encuesta } = req.body;
        const value = tipo_encuesta.trim();

        // Verificar duplicado
        const exists = await TipoEncuestas.findOne({ where: { tipo_encuesta: value } });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'El tipo de encuesta ya existe'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await TipoEncuestas.create({ tipo_encuesta: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Tipo de encuesta creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[tipoencuestasPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /tipoencuestas/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const tipoencuestaPut = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { tipo_encuesta } = req.body;
        const value = tipo_encuesta.trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await TipoEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            const duplicado = await TipoEncuestas.findOne({
                where: {
                    tipo_encuesta:   value,
                    id_tipoencuesta: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El tipo de encuesta ya existe');
                err.statusCode = 409;
                throw err;
            }

            await registro.update({ tipo_encuesta: value }, { transaction: t });
            return await TipoEncuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de encuesta no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de encuesta actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[tipoencuestasPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /tipoencuestas/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const tipoencuestaPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { tipo_encuesta } = req.body;
        const value = tipo_encuesta.trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await TipoEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Solo verificar duplicado si el valor realmente cambia
            if (registro.tipo_encuesta !== value) {
                const duplicado = await TipoEncuestas.findOne({
                    where: {
                        tipo_encuesta:   value,
                        id_tipoencuesta: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El tipo de encuesta ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update({ tipo_encuesta: value }, { transaction: t });
            return await TipoEncuestas.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de encuesta no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de encuesta actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[tipoencuestasPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /tipoencuestas/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const tipoencuestaDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await TipoEncuestas.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de encuesta no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de encuesta eliminado correctamente',
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
                message: 'No se puede eliminar: el tipo de encuesta está referenciado en otras tablas'
            });
        }
        console.error('[tipoencuestasDelete]', error.message || error);
        return next(error);
    }
};
