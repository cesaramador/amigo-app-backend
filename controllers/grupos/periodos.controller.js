import Periodos from "../../models/grupos/periodos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_periodo', 'periodo', 'fecha_inicio', 'fecha_fin'];
const DEFAULT_SORT_FIELD  = 'id_periodo';

// ─────────────────────────────────────────────────────────────────────────────
// GET /periodos  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const periodosGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Búsqueda por texto en campo periodo
        const q     = (req.query.q || '').trim();
        const where = q ? { periodo: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await Periodos.findAndCountAll({
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
        console.error('[periodosGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /periodos/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const periodoGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const periodo = await Periodos.findByPk(id);

        if (!periodo) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({ success: true, data: periodo });
    } catch (error) {
        console.error('[periodoGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /periodos  →  crear nuevo periodo
// ─────────────────────────────────────────────────────────────────────────────
export const periodoPost = async (req, res, next) => {
    try {
        const { periodo, fecha_inicio, fecha_fin } = req.body;
        const periodoValue = periodo.trim();

        // Verificar duplicado de nombre de periodo
        const existe = await Periodos.findOne({ where: { periodo: periodoValue } });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El periodo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Periodos.create(
                { periodo: periodoValue, fecha_inicio: fecha_inicio ?? null, fecha_fin: fecha_fin ?? null },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Periodo creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[periodoPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /periodos/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const periodoPut = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { periodo, fecha_inicio, fecha_fin } = req.body;
        const periodoValue = periodo.trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Periodos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de nombre si cambió
            if (periodoValue !== registro.periodo) {
                const duplicado = await Periodos.findOne({
                    where: { periodo: periodoValue, id_periodo: { [Op.ne]: id } },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El periodo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(
                {
                    periodo: periodoValue,
                    fecha_inicio: fecha_inicio ?? null,
                    fecha_fin: fecha_fin ?? null
                },
                { transaction: t }
            );
            return await Periodos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[periodoPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /periodos/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const periodoPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Construir objeto de cambios validados
        const cambios = {};

        if ('periodo' in req.body) {
            cambios.periodo = req.body.periodo.trim();
        }

        if ('fecha_inicio' in req.body) {
            cambios.fecha_inicio = req.body.fecha_inicio;
        }
        if ('fecha_fin' in req.body) {
            cambios.fecha_fin = req.body.fecha_fin;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Periodos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de nombre si cambió
            if ('periodo' in cambios && cambios.periodo !== registro.periodo) {
                const duplicado = await Periodos.findOne({
                    where: { periodo: cambios.periodo, id_periodo: { [Op.ne]: id } },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El periodo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await Periodos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('[periodoPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /periodos/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const periodoDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Periodos.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo eliminado correctamente',
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
                message: 'No se puede eliminar: el periodo está referenciado en otras tablas'
            });
        }
        console.error('[periodoDelete]', error.message || error);
        return next(error);
    }
};
