import TiposGrupos from "../../models/grupos/tiposgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_tipogrupo', 'tipo_grupo'];
const DEFAULT_SORT_FIELD  = 'id_tipogrupo';

// ─────────────────────────────────────────────────────────────────────────────
// GET /tiposgrupos  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const tiposgruposGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto en tipo_grupo
        const q     = (req.query.q || '').trim();
        const where = q ? { tipo_grupo: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await TiposGrupos.findAndCountAll({
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
        console.error('[tiposgruposGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /tiposgrupos/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const tiposgrupoGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Lectura simple: sin transacción explícita
        const registro = await TiposGrupos.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Tipo de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[tipogrupoGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /tiposgrupos  →  crear nuevo tipo de grupo
// ─────────────────────────────────────────────────────────────────────────────
export const tiposgrupoPost = async (req, res, next) => {
    try {
        const value = String(req.body.tipo_grupo).trim();

        // Verificar duplicado (campo unique en el modelo)
        const existe = await TiposGrupos.findOne({ where: { tipo_grupo: value } });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El tipo de grupo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await TiposGrupos.create({ tipo_grupo: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Tipo de grupo creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[tipogrupoPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /tiposgrupos/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const tiposgrupoPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const value = String(req.body.tipo_grupo).trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await TiposGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            if (value !== registro.tipo_grupo) {
                const duplicado = await TiposGrupos.findOne({
                    where: { tipo_grupo: value, id_tipogrupo: { [Op.ne]: id } },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El tipo de grupo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update({ tipo_grupo: value }, { transaction: t });
            return await TiposGrupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Tipo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de grupo actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[tipogrupoPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /tiposgrupos/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const tiposgrupoPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const value = String(req.body.tipo_grupo).trim();

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await TiposGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado solo si el valor cambia
            if (value !== registro.tipo_grupo) {
                const duplicado = await TiposGrupos.findOne({
                    where: { tipo_grupo: value, id_tipogrupo: { [Op.ne]: id } },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El tipo de grupo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update({ tipo_grupo: value }, { transaction: t });
            return await TiposGrupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Tipo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de grupo actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[tipogrupoPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /tiposgrupos/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const tiposgrupoDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await TiposGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Tipo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de grupo eliminado correctamente',
            data: eliminado
        });
    } catch (error) {
        // Integridad referencial — TiposGrupos es referenciado por Grupos
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: el tipo de grupo está referenciado en otras tablas'
            });
        }
        console.error('[tipogrupoDelete]', error.message || error);
        return next(error);
    }
};
