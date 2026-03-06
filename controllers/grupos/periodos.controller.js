import Periodos from "../../models/grupos/periodos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = ['id_periodo', 'periodo', 'fecha_inicio', 'fecha_fin'];
const DEFAULT_SORT_FIELD  = 'id_periodo';

// ─── Helper: parsear y validar fecha ─────────────────────────────────────────
/**
 * Convierte una cadena a Date. Devuelve null si el valor es nulo/undefined/vacío,
 * y lanza un error descriptivo si la cadena no es una fecha válida.
 */
const parseDate = (value, fieldName) => {
    if (value === undefined || value === null || value === '') return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        const err = new Error(`El campo ${fieldName} no es una fecha válida`);
        err.statusCode = 400;
        throw err;
    }
    return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /periodos  →  lista paginada con búsqueda y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const periodosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
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
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

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

        // Validar campo periodo (obligatorio)
        if (!periodo || typeof periodo !== 'string' || periodo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo periodo es obligatorio' });
        }
        const periodoValue = periodo.trim();

        // Longitud máxima desde el modelo (se usa el valor ya recortado)
        const attrs     = Periodos.rawAttributes || {};
        const maxLength = attrs.periodo?.type?.options?.length
                       ?? attrs.periodo?._length
                       ?? 100;
        if (periodoValue.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo periodo no puede exceder ${maxLength} caracteres`
            });
        }

        // Validar y normalizar fechas opcionales
        let fechaInicioVal, fechaFinVal;
        try {
            fechaInicioVal = parseDate(fecha_inicio, 'fecha_inicio');
            fechaFinVal    = parseDate(fecha_fin,    'fecha_fin');
        } catch (e) {
            return res.status(400).json({ success: false, message: e.message });
        }

        // Coherencia de rango: fecha_inicio debe ser anterior a fecha_fin
        if (fechaInicioVal && fechaFinVal && fechaInicioVal > fechaFinVal) {
            return res.status(400).json({ success: false, message: 'fecha_inicio no puede ser posterior a fecha_fin' });
        }

        // Verificar duplicado de nombre de periodo
        const existe = await Periodos.findOne({ where: { periodo: periodoValue } });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El periodo ya existe' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await Periodos.create(
                { periodo: periodoValue, fecha_inicio: fechaInicioVal, fecha_fin: fechaFinVal },
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
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { periodo, fecha_inicio, fecha_fin } = req.body;

        // Validar campo periodo (obligatorio en PUT)
        if (!periodo || typeof periodo !== 'string' || periodo.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo periodo es obligatorio' });
        }
        const periodoValue = periodo.trim();

        // Longitud máxima desde el modelo
        const attrs     = Periodos.rawAttributes || {};
        const maxLength = attrs.periodo?.type?.options?.length
                       ?? attrs.periodo?._length
                       ?? 100;
        if (periodoValue.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `El campo periodo no puede exceder ${maxLength} caracteres`
            });
        }

        // Validar y normalizar fechas (null si no se envían → reemplazo total)
        let fechaInicioVal, fechaFinVal;
        try {
            fechaInicioVal = parseDate(fecha_inicio, 'fecha_inicio');
            fechaFinVal    = parseDate(fecha_fin,    'fecha_fin');
        } catch (e) {
            return res.status(400).json({ success: false, message: e.message });
        }

        // Coherencia de rango
        if (fechaInicioVal && fechaFinVal && fechaInicioVal > fechaFinVal) {
            return res.status(400).json({ success: false, message: 'fecha_inicio no puede ser posterior a fecha_fin' });
        }

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
                { periodo: periodoValue, fecha_inicio: fechaInicioVal, fecha_fin: fechaFinVal },
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
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const camposPermitidos = ['periodo', 'fecha_inicio', 'fecha_fin'];
        const camposRecibidos  = Object.keys(req.body).filter(k => camposPermitidos.includes(k));

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Se requiere al menos uno de los campos: ${camposPermitidos.join(', ')}`
            });
        }

        // Construir objeto de cambios validados
        const cambios = {};

        if ('periodo' in req.body) {
            const { periodo } = req.body;
            if (typeof periodo !== 'string' || periodo.trim() === '') {
                return res.status(400).json({ success: false, message: 'El campo periodo no es válido' });
            }
            const periodoValue = periodo.trim();

            const attrs     = Periodos.rawAttributes || {};
            const maxLength = attrs.periodo?.type?.options?.length
                           ?? attrs.periodo?._length
                           ?? 100;
            if (periodoValue.length > maxLength) {
                return res.status(400).json({
                    success: false,
                    message: `El campo periodo no puede exceder ${maxLength} caracteres`
                });
            }
            cambios.periodo = periodoValue;
        }

        // Validar fechas solo si fueron enviadas
        try {
            if ('fecha_inicio' in req.body) {
                cambios.fecha_inicio = parseDate(req.body.fecha_inicio, 'fecha_inicio');
            }
            if ('fecha_fin' in req.body) {
                cambios.fecha_fin = parseDate(req.body.fecha_fin, 'fecha_fin');
            }
        } catch (e) {
            return res.status(400).json({ success: false, message: e.message });
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await Periodos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Coherencia de rango usando valores finales
            const fechaInicioFinal = 'fecha_inicio' in cambios ? cambios.fecha_inicio : registro.fecha_inicio;
            const fechaFinFinal    = 'fecha_fin'    in cambios ? cambios.fecha_fin    : registro.fecha_fin;
            if (fechaInicioFinal && fechaFinFinal && fechaInicioFinal > fechaFinFinal) {
                const err = new Error('fecha_inicio no puede ser posterior a fecha_fin');
                err.statusCode = 400;
                throw err;
            }

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
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

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
