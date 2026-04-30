import EstatusGrupo from "../../models/grupos/estatusgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_estatusgrupo', 'estatus_grupo'];
const DEFAULT_SORT_FIELD  = 'id_estatusgrupo';

// ─────────────────────────────────────────────────────────────────────────────
// GET /estatusgrupos  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const estatusgruposGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo correcto
        const q     = (req.query.q || '').trim();
        const where = q ? { estatus_grupo: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await EstatusGrupo.findAndCountAll({
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
        console.error('[estatusgruposGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /estatusgrupos/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const estatusgrupoGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const registro = await EstatusGrupo.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[estatusgruposGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /estatusgrupos  →  crear nuevo estatus de grupo
// ─────────────────────────────────────────────────────────────────────────────
export const estatusgrupoPost = async (req, res, next) => {
    try {
        const { estatus_grupo } = req.body;
        const value = estatus_grupo.trim();

        // Verificar duplicado
        const exists = await EstatusGrupo.findOne({ where: { estatus_grupo: value } });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El estatus de grupo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await EstatusGrupo.create({ estatus_grupo: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Estatus de grupo creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[estatusgrupoPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /estatusgrupos/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const estatusgrupoPut = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { estatus_grupo } = req.body;
        const value = estatus_grupo.trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await EstatusGrupo.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            const duplicado = await EstatusGrupo.findOne({
                where: { estatus_grupo: value, id_estatusgrupo: { [Op.ne]: id } },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El estatus de grupo ya existe');
                err.statusCode = 409;
                throw err;
            }

            await registro.update({ estatus_grupo: value }, { transaction: t });
            return await EstatusGrupo.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de grupo actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[estatusgrupoPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /estatusgrupos/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const estatusgrupoPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { estatus_grupo } = req.body;
        const value = estatus_grupo.trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await EstatusGrupo.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Solo verificar duplicado si el valor realmente cambia
            if (registro.estatus_grupo !== value) {
                const duplicado = await EstatusGrupo.findOne({
                    where: { estatus_grupo: value, id_estatusgrupo: { [Op.ne]: id } },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El estatus de grupo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update({ estatus_grupo: value }, { transaction: t });
            return await EstatusGrupo.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de grupo actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[estatusgrupoPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /estatusgrupos/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const estatusgrupoDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await EstatusGrupo.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Estatus de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Estatus de grupo eliminado correctamente',
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
                message: 'No se puede eliminar: el estatus de grupo está referenciado en otras tablas'
            });
        }
        console.error('[estatusgrupoDelete]', error.message || error);
        return next(error);
    }
};
