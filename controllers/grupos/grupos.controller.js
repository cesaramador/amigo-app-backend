import Grupos from "../../models/grupos/grupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_grupo', 'nombre_grupo', 'id_tipogrupo'];
const DEFAULT_SORT_FIELD  = 'id_grupo';

// ─────────────────────────────────────────────────────────────────────────────
// GET /grupos  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const gruposGet = async (req, res, next) => {
    try {
        // Parametros ya validados/sanitizados por middleware
        const page   = req.query.page || 1;
        const limit  = req.query.limit || 10;
        const offset = (page - 1) * limit;

        // Filtros opcionales
        const where = {};

        // Búsqueda por texto en nombre_grupo
        const q = (req.query.q || '').trim();
        if (q) where.nombre_grupo = { [Op.like]: `%${q}%` };

        // Filtrar por tipo de grupo
        if (req.query.id_tipogrupo !== undefined) {
            where.id_tipogrupo = req.query.id_tipogrupo;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await Grupos.findAndCountAll({
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
        console.error('[gruposGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /grupos/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const grupoGetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lectura simple: sin transacción explícita
        const grupo = await Grupos.findByPk(id);

        if (!grupo) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({ success: true, data: grupo });
    } catch (error) {
        console.error('[gruposGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /grupos  →  crear nuevo grupo
// ─────────────────────────────────────────────────────────────────────────────
export const grupoPost = async (req, res, next) => {
    try {
        const { nombre_grupo, id_tipogrupo } = req.body;
        const nombreValue = nombre_grupo.trim();
        const idTgValue = id_tipogrupo ?? null;

        // Verificar duplicado de nombre
        const exists = await Grupos.findOne({ where: { nombre_grupo: nombreValue } });
        if (exists) {
            return res.status(409).json({ success: false, message: 'El nombre del grupo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Grupos.create(
                { nombre_grupo: nombreValue, id_tipogrupo: idTgValue },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Grupo creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[grupoPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /grupos/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const grupoPut = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre_grupo, id_tipogrupo } = req.body;
        const nombreValue = nombre_grupo.trim();
        const idTgValue = id_tipogrupo ?? null;

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Grupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de nombre (excluir el propio registro)
            const duplicado = await Grupos.findOne({
                where: { nombre_grupo: nombreValue, id_grupo: { [Op.ne]: id } },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El nombre del grupo ya existe');
                err.statusCode = 409;
                throw err;
            }

            await registro.update({ nombre_grupo: nombreValue, id_tipogrupo: idTgValue }, { transaction: t });
            return await Grupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Grupo actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[grupoPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /grupos/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const grupoPatch = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Construir objeto de cambios validados
        const cambios = {};

        if ('nombre_grupo' in req.body) {
            cambios.nombre_grupo = req.body.nombre_grupo.trim();
        }

        if ('id_tipogrupo' in req.body) {
            cambios.id_tipogrupo = req.body.id_tipogrupo;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Grupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de nombre solo si cambia
            if ('nombre_grupo' in cambios && registro.nombre_grupo !== cambios.nombre_grupo) {
                const duplicado = await Grupos.findOne({
                    where: { nombre_grupo: cambios.nombre_grupo, id_grupo: { [Op.ne]: id } },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El nombre del grupo ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await Grupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Grupo actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[grupoPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /grupos/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const grupoDelete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await Grupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Grupo eliminado correctamente',
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
                message: 'No se puede eliminar: el grupo está referenciado en otras tablas'
            });
        }
        console.error('[grupoDelete]', error.message || error);
        return next(error);
    }
};
