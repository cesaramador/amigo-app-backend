import ServiciosProveedores from "../../models/proveedores/serviciosproveedores.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_servicioproveedor',
    'servicio_proveedor',
    'id_tipo_servicio'
];
const DEFAULT_SORT_FIELD = 'id_servicioproveedor';

// ─── Longitudes máximas derivadas del modelo ──────────────────────────────────
const MAX_SERVICIO_PROVEEDOR = 500;

// ─────────────────────────────────────────────────────────────────────────────
// GET /serviciosproveedores  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const serviciosProveedoresGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por texto sobre el campo servicio_proveedor
        const q     = (req.query.q || '').trim();
        const where = q ? { servicio_proveedor: { [Op.like]: `%${q}%` } } : {};

        // Filtro opcional por id_tipo_servicio
        if (req.query.id_tipo_servicio !== undefined) {
            const idTipo = parseInt(req.query.id_tipo_servicio, 10);
            if (!Number.isInteger(idTipo) || idTipo <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro id_tipo_servicio debe ser un entero positivo'
                });
            }
            where.id_tipo_servicio = idTipo;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await ServiciosProveedores.findAndCountAll({
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
        console.error('[serviciosProveedoresGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /serviciosproveedores/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const serviciosProveedorGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        // Lectura simple: sin transacción explícita
        const registro = await ServiciosProveedores.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[serviciosProveedoresGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /serviciosproveedores  →  crear nuevo servicio de proveedor
// ─────────────────────────────────────────────────────────────────────────────
export const serviciosProveedorPost = async (req, res, next) => {
    try {
        const { servicio_proveedor, id_tipo_servicio } = req.body;

        // ── Validación: servicio_proveedor ───────────────────────────────────
        if (!servicio_proveedor || typeof servicio_proveedor !== 'string' || servicio_proveedor.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo servicio_proveedor es obligatorio'
            });
        }
        const servicioVal = servicio_proveedor.trim();
        if (servicioVal.length > MAX_SERVICIO_PROVEEDOR) {
            return res.status(400).json({
                success: false,
                message: `El campo servicio_proveedor no puede exceder ${MAX_SERVICIO_PROVEEDOR} caracteres`
            });
        }

        // ── Validación: id_tipo_servicio ─────────────────────────────────────
        const idTipo = parseInt(id_tipo_servicio, 10);
        if (!Number.isInteger(idTipo) || idTipo <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_tipo_servicio debe ser un entero positivo'
            });
        }

        // Verificar duplicado: mismo nombre dentro del mismo tipo de servicio
        const exists = await ServiciosProveedores.findOne({
            where: { servicio_proveedor: servicioVal, id_tipo_servicio: idTipo }
        });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un servicio de proveedor con ese nombre en el mismo tipo de servicio'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await ServiciosProveedores.create(
                {
                    servicio_proveedor: servicioVal,
                    id_tipo_servicio:   idTipo
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Servicio de proveedor creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[serviciosProveedoresPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /serviciosproveedores/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const serviciosProveedorPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { servicio_proveedor, id_tipo_servicio } = req.body;

        // ── Validación: servicio_proveedor ───────────────────────────────────
        if (!servicio_proveedor || typeof servicio_proveedor !== 'string' || servicio_proveedor.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo servicio_proveedor es obligatorio'
            });
        }
        const servicioVal = servicio_proveedor.trim();
        if (servicioVal.length > MAX_SERVICIO_PROVEEDOR) {
            return res.status(400).json({
                success: false,
                message: `El campo servicio_proveedor no puede exceder ${MAX_SERVICIO_PROVEEDOR} caracteres`
            });
        }

        // ── Validación: id_tipo_servicio ─────────────────────────────────────
        const idTipo = parseInt(id_tipo_servicio, 10);
        if (!Number.isInteger(idTipo) || idTipo <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_tipo_servicio debe ser un entero positivo'
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await ServiciosProveedores.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado (excluir el propio registro)
            const duplicado = await ServiciosProveedores.findOne({
                where: {
                    servicio_proveedor:   servicioVal,
                    id_tipo_servicio:     idTipo,
                    id_servicioproveedor: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe un servicio de proveedor con ese nombre en el mismo tipo de servicio');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                { servicio_proveedor: servicioVal, id_tipo_servicio: idTipo },
                { transaction: t }
            );
            return await ServiciosProveedores.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Servicio de proveedor actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[serviciosProveedoresPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /serviciosproveedores/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const serviciosProveedorPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { servicio_proveedor, id_tipo_servicio } = req.body;

        // Al menos un campo debe venir en el body
        if (servicio_proveedor === undefined && id_tipo_servicio === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar: servicio_proveedor, id_tipo_servicio'
            });
        }

        // ── Validaciones de los campos presentes ─────────────────────────────
        const updates = {};

        if (servicio_proveedor !== undefined) {
            if (typeof servicio_proveedor !== 'string' || servicio_proveedor.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El campo servicio_proveedor no es válido'
                });
            }
            const servicioVal = servicio_proveedor.trim();
            if (servicioVal.length > MAX_SERVICIO_PROVEEDOR) {
                return res.status(400).json({
                    success: false,
                    message: `El campo servicio_proveedor no puede exceder ${MAX_SERVICIO_PROVEEDOR} caracteres`
                });
            }
            updates.servicio_proveedor = servicioVal;
        }

        if (id_tipo_servicio !== undefined) {
            const idTipo = parseInt(id_tipo_servicio, 10);
            if (!Number.isInteger(idTipo) || idTipo <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_tipo_servicio debe ser un entero positivo'
                });
            }
            updates.id_tipo_servicio = idTipo;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await ServiciosProveedores.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado con los valores resultantes
            const servicioFinal = updates.servicio_proveedor ?? registro.servicio_proveedor;
            const tipoFinal     = updates.id_tipo_servicio   ?? registro.id_tipo_servicio;

            const duplicado = await ServiciosProveedores.findOne({
                where: {
                    servicio_proveedor:   servicioFinal,
                    id_tipo_servicio:     tipoFinal,
                    id_servicioproveedor: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe un servicio de proveedor con ese nombre en el mismo tipo de servicio');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(updates, { transaction: t });
            return await ServiciosProveedores.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Servicio de proveedor actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[serviciosProveedoresPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /serviciosproveedores/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const serviciosProveedorDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await ServiciosProveedores.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Servicio de proveedor no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Servicio de proveedor eliminado correctamente',
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
                message: 'No se puede eliminar: el servicio de proveedor está referenciado en otras tablas'
            });
        }
        console.error('[serviciosProveedoresDelete]', error.message || error);
        return next(error);
    }
};
