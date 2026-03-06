import ProveedoresConServicios from "../../models/proveedores/proveedoresconservicios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_proveedorconservicio',
    'id_usuario',
    'id_servicio_proveedor'
];
const DEFAULT_SORT_FIELD = 'id_proveedorconservicio';

// ─────────────────────────────────────────────────────────────────────────────
// GET /proveedoresconservicios  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const proveedoresconserviciosGet = async (req, res, next) => {
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

        // Filtro opcional por id_servicio_proveedor
        if (req.query.id_servicio_proveedor !== undefined) {
            const idSrv = parseInt(req.query.id_servicio_proveedor, 10);
            if (!Number.isInteger(idSrv) || idSrv <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro id_servicio_proveedor debe ser un entero positivo'
                });
            }
            where.id_servicio_proveedor = idSrv;
        }

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await ProveedoresConServicios.findAndCountAll({
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
        console.error('[proveedoresconserviciosGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /proveedoresconservicios/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const proveedoresconserviciosGetById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        // Lectura simple: sin transacción explícita
        const registro = await ProveedoresConServicios.findByPk(id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor con servicio no encontrado'
            });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[proveedoresconserviciosGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /proveedoresconservicios  →  crear nuevo registro proveedor-servicio
// ─────────────────────────────────────────────────────────────────────────────
export const proveedoresconserviciosPost = async (req, res, next) => {
    try {
        const { id_usuario, id_servicio_proveedor } = req.body;

        // ── Validación: id_usuario ───────────────────────────────────────────
        const idUsr = parseInt(id_usuario, 10);
        if (!Number.isInteger(idUsr) || idUsr <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_usuario debe ser un entero positivo'
            });
        }

        // ── Validación: id_servicio_proveedor ────────────────────────────────
        const idSrv = parseInt(id_servicio_proveedor, 10);
        if (!Number.isInteger(idSrv) || idSrv <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_servicio_proveedor debe ser un entero positivo'
            });
        }

        // Verificar duplicado: combinación única id_usuario + id_servicio_proveedor
        const exists = await ProveedoresConServicios.findOne({
            where: { id_usuario: idUsr, id_servicio_proveedor: idSrv }
        });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'El usuario ya tiene registrado ese servicio de proveedor'
            });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await ProveedoresConServicios.create(
                {
                    id_usuario:           idUsr,
                    id_servicio_proveedor: idSrv
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Proveedor con servicio registrado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[proveedoresconserviciosPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /proveedoresconservicios/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const proveedoresconserviciosPut = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { id_usuario, id_servicio_proveedor } = req.body;

        // ── Validaciones ─────────────────────────────────────────────────────
        const idUsr = parseInt(id_usuario, 10);
        if (!Number.isInteger(idUsr) || idUsr <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_usuario debe ser un entero positivo'
            });
        }

        const idSrv = parseInt(id_servicio_proveedor, 10);
        if (!Number.isInteger(idSrv) || idSrv <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El campo id_servicio_proveedor debe ser un entero positivo'
            });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await ProveedoresConServicios.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de combinación (excluir el propio registro)
            const duplicado = await ProveedoresConServicios.findOne({
                where: {
                    id_usuario:              idUsr,
                    id_servicio_proveedor:   idSrv,
                    id_proveedorconservicio: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El usuario ya tiene registrado ese servicio de proveedor');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    id_usuario:           idUsr,
                    id_servicio_proveedor: idSrv
                },
                { transaction: t }
            );
            return await ProveedoresConServicios.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor con servicio no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Proveedor con servicio actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[proveedoresconserviciosPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /proveedoresconservicios/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const proveedoresconserviciosPatch = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const { id_usuario, id_servicio_proveedor } = req.body;

        // Al menos un campo debe venir en el body
        if (id_usuario === undefined && id_servicio_proveedor === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar: id_usuario, id_servicio_proveedor'
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

        if (id_servicio_proveedor !== undefined) {
            const idSrv = parseInt(id_servicio_proveedor, 10);
            if (!Number.isInteger(idSrv) || idSrv <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_servicio_proveedor debe ser un entero positivo'
                });
            }
            updates.id_servicio_proveedor = idSrv;
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await ProveedoresConServicios.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado con los valores resultantes
            const usuarioFinal  = updates.id_usuario            ?? registro.id_usuario;
            const servicioFinal = updates.id_servicio_proveedor ?? registro.id_servicio_proveedor;

            const duplicado = await ProveedoresConServicios.findOne({
                where: {
                    id_usuario:              usuarioFinal,
                    id_servicio_proveedor:   servicioFinal,
                    id_proveedorconservicio: { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('El usuario ya tiene registrado ese servicio de proveedor');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(updates, { transaction: t });
            return await ProveedoresConServicios.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor con servicio no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Proveedor con servicio actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[proveedoresconserviciosPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /proveedoresconservicios/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const proveedoresconserviciosDelete = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido: debe ser un entero positivo'
            });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await ProveedoresConServicios.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor con servicio no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Proveedor con servicio eliminado correctamente',
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
        console.error('[proveedoresconserviciosDelete]', error.message || error);
        return next(error);
    }
};
