import TiposServiciosProveedores from "../../models/proveedores/tiposserviciosproveedores.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_tiposervicioproveedor', 'tipo_servicio_proveedor'];
const DEFAULT_SORT_FIELD  = 'id_tiposervicioproveedor';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
const MAX_TIPO_SERVICIO_PROVEEDOR = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /tiposserviciosproveedores  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const tiposServiciosProveedoresGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo tipo_servicio_proveedor
        const q     = (req.query.q || '').trim();
        const where = q ? { tipo_servicio_proveedor: { [Op.like]: `%${q}%` } } : {};

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await TiposServiciosProveedores.findAndCountAll({
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
        console.error('[tiposServiciosProveedoresGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /tiposserviciosproveedores/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const tiposServiciosProveedorGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        // Lectura simple: sin transacción explícita
        const registro = await TiposServiciosProveedores.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[tiposServiciosProveedoresGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /tiposserviciosproveedores  →  crear nuevo tipo de servicio de proveedor
// ─────────────────────────────────────────────────────────────────────────────
export const tiposServiciosProveedorPost = async (req, res, next) => {
    try {
        const { tipo_servicio_proveedor } = req.body;

        // ── Validación ───────────────────────────────────────────────────────
        if (!tipo_servicio_proveedor || typeof tipo_servicio_proveedor !== 'string' || tipo_servicio_proveedor.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo tipo_servicio_proveedor es obligatorio'
            });
        }
        const value = tipo_servicio_proveedor.trim();
        if (value.length > MAX_TIPO_SERVICIO_PROVEEDOR) {
            return res.status(400).json({
                success: false,
                message: `El campo tipo_servicio_proveedor no puede exceder ${MAX_TIPO_SERVICIO_PROVEEDOR} caracteres`
            });
        }

        // Verificar duplicado
        const exists = await TiposServiciosProveedores.findOne({ where: { tipo_servicio_proveedor: value } });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'El tipo de servicio de proveedor ya existe'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await TiposServiciosProveedores.create({ tipo_servicio_proveedor: value }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Tipo de servicio de proveedor creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[tiposServiciosProveedoresPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /tiposserviciosproveedores/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const tiposServiciosProveedorPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { tipo_servicio_proveedor } = req.body;
        if (!tipo_servicio_proveedor || typeof tipo_servicio_proveedor !== 'string' || tipo_servicio_proveedor.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo tipo_servicio_proveedor es obligatorio'
            });
        }
        const value = tipo_servicio_proveedor.trim();
        if (value.length > MAX_TIPO_SERVICIO_PROVEEDOR) {
            return res.status(400).json({
                success: false,
                message: `El campo tipo_servicio_proveedor no puede exceder ${MAX_TIPO_SERVICIO_PROVEEDOR} caracteres`
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await TiposServiciosProveedores.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            const duplicado = await TiposServiciosProveedores.findOne({
                where: {
                    tipo_servicio_proveedor,
                    id_tiposervicioproveedor: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El tipo de servicio de proveedor ya existe');
                err.statusCode = 409;
                throw err;
            }

            await registro.update({ tipo_servicio_proveedor: value }, { transaction: t });
            return await TiposServiciosProveedores.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de servicio de proveedor actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[tiposServiciosProveedoresPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /tiposserviciosproveedores/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const tiposServiciosProveedorPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { tipo_servicio_proveedor } = req.body;
        if (typeof tipo_servicio_proveedor === 'undefined' || tipo_servicio_proveedor === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo tipo_servicio_proveedor es requerido'
            });
        }
        if (typeof tipo_servicio_proveedor !== 'string' || tipo_servicio_proveedor.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo tipo_servicio_proveedor no es válido'
            });
        }

        const value = tipo_servicio_proveedor.trim();
        if (value.length > MAX_TIPO_SERVICIO_PROVEEDOR) {
            return res.status(400).json({
                success: false,
                message: `El campo tipo_servicio_proveedor no puede exceder ${MAX_TIPO_SERVICIO_PROVEEDOR} caracteres`
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await TiposServiciosProveedores.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Solo verificar duplicado si el valor realmente cambia
            if (registro.tipo_servicio_proveedor !== value) {
                const duplicado = await TiposServiciosProveedores.findOne({
                    where: {
                        tipo_servicio_proveedor:  value,
                        id_tiposervicioproveedor: { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('El tipo de servicio de proveedor ya existe');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update({ tipo_servicio_proveedor: value }, { transaction: t });
            return await TiposServiciosProveedores.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de servicio de proveedor actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[tiposServiciosProveedoresPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /tiposserviciosproveedores/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const tiposServiciosProveedorDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await TiposServiciosProveedores.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de servicio de proveedor eliminado correctamente',
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
                message: 'No se puede eliminar: el tipo de servicio de proveedor está referenciado en otras tablas'
            });
        }
        console.error('[tiposServiciosProveedoresDelete]', error.message || error);
        return next(error);
    }
};
