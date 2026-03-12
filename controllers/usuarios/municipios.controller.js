import Municipio from "../../models/usuarios/municipios.model.js";
import Estado from "../../models/usuarios/estados.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Helper: obtener longitud máxima del atributo desde el modelo
const getMaxLength = (field) => {
    const attrs = Municipio.rawAttributes || {};
    // DataTypes.STRING(n) almacena n en type.options.length
    return attrs[field]?.type?.options?.length ?? 100;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/municipios
// Obtener todos los municipios (con paginación, búsqueda y orden)
// ─────────────────────────────────────────────────────────────────────────────
export const municipiosGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre de municipio
        const q = (req.query.q || '').trim();
        const where = q ? { municipio: { [Op.like]: `%${q}%` } } : {};

        // Filtro adicional por estado
        if (req.query.id_estado) {
            const idEstadoFiltro = Number(req.query.id_estado);
            if (!Number.isInteger(idEstadoFiltro) || idEstadoFiltro <= 0) {
                return res.status(400).json({ success: false, message: 'id_estado de filtro inválido.' });
            }
            where.id_estado = idEstadoFiltro;
        }

        // Orden seguro
        const allowedSortFields = ['id_municipio', 'municipio', 'id_estado', 'num_municipio'];
        const [sortField = 'id_municipio', sortOrderRaw = 'asc'] =
            (req.query.sort || 'id_municipio:asc').split(':');
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_municipio';
        const sortOrder = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await Municipio.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortFieldSafe, sortOrder]]
        });

        const total = result.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            meta: { total, page, pages, limit, sort: `${sortFieldSafe}:${sortOrder}` },
            data: result.rows
        });
    } catch (error) {
        console.error('Error en municipiosGet:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/municipios/:id
// Obtener un municipio por ID
// ─────────────────────────────────────────────────────────────────────────────
export const municipioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const municipio = await Municipio.findByPk(id);

        if (!municipio) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado.' });
        }

        return res.status(200).json({ success: true, data: municipio });
    } catch (error) {
        console.error('Error en municipioGetById:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/municipios
// Crear un nuevo municipio
// ─────────────────────────────────────────────────────────────────────────────
export const municipioPost = async (req, res, next) => {
    try {
        const { id_estado, num_municipio, municipio } = req.body;

        // Validaciones básicas de presencia y tipo
        const idEstadoNum = Number(id_estado);
        if (!Number.isInteger(idEstadoNum) || idEstadoNum <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_estado es obligatorio y debe ser un entero positivo.' });
        }
        const numMunicipioNum = Number(num_municipio);
        if (!Number.isInteger(numMunicipioNum) || numMunicipioNum <= 0) {
            return res.status(400).json({ success: false, message: 'El campo num_municipio es obligatorio y debe ser un entero positivo.' });
        }
        if (!municipio || typeof municipio !== 'string' || municipio.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo municipio es obligatorio y debe ser texto.' });
        }

        const municipioTrim = municipio.trim();

        // Validación de longitud máxima
        const maxLen = getMaxLength('municipio');
        if (municipioTrim.length > maxLen) {
            return res.status(400).json({ success: false, message: `El campo municipio no puede exceder ${maxLen} caracteres.` });
        }

        // Verificación de FK + duplicados + creación dentro de la misma transacción
        const nuevo = await sequelize.transaction(async (t) => {
            // Verificar que el estado exista
            const estadoExist = await Estado.findByPk(idEstadoNum, { transaction: t });
            if (!estadoExist) {
                const err = new Error('El id_estado proporcionado no existe.');
                err.statusCode = 404;
                throw err;
            }

            // Verificar duplicado: mismo estado con igual num_municipio o igual nombre
            const conflict = await Municipio.findOne({
                where: {
                    id_estado: idEstadoNum,
                    [Op.or]: [
                        { num_municipio: numMunicipioNum },
                        { municipio: municipioTrim }
                    ]
                },
                transaction: t
            });
            if (conflict) {
                const err = new Error('El num_municipio o el nombre del municipio ya existe en ese estado.');
                err.statusCode = 409;
                throw err;
            }

            return await Municipio.create({
                id_estado: idEstadoNum,
                num_municipio: numMunicipioNum,
                municipio: municipioTrim
            }, { transaction: t });
        });

        return res.status(201).json({
            success: true,
            message: 'Municipio creado exitosamente.',
            data: nuevo.get({ plain: true })
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en municipioPost:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/municipios/:id
// Reemplazar completamente un municipio por ID
// ─────────────────────────────────────────────────────────────────────────────
export const municipioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { id_estado, num_municipio, municipio } = req.body;

        // PUT requiere todos los campos
        if (id_estado === undefined || num_municipio === undefined || municipio === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren los campos: id_estado, num_municipio y municipio.'
            });
        }

        const idEstadoNum    = Number(id_estado);
        const numMunicipioNum = Number(num_municipio);

        if (!Number.isInteger(idEstadoNum) || idEstadoNum <= 0) {
            return res.status(400).json({ success: false, message: 'El campo id_estado debe ser un entero positivo.' });
        }
        if (!Number.isInteger(numMunicipioNum) || numMunicipioNum <= 0) {
            return res.status(400).json({ success: false, message: 'El campo num_municipio debe ser un entero positivo.' });
        }
        if (typeof municipio !== 'string' || municipio.trim() === '') {
            return res.status(400).json({ success: false, message: 'El campo municipio debe ser texto no vacío.' });
        }

        const municipioTrim = municipio.trim();

        const maxLength = getMaxLength('municipio');
        if (municipioTrim.length > maxLength) {
            return res.status(400).json({ success: false, message: `El campo municipio no puede exceder ${maxLength} caracteres.` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await Municipio.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar que el estado exista
            const estadoExist = await Estado.findByPk(idEstadoNum, { transaction: t });
            if (!estadoExist) {
                const err = new Error('El id_estado proporcionado no existe.');
                err.statusCode = 404;
                throw err;
            }

            // Verificar duplicados dentro del mismo estado (excluir el registro actual)
            const conflict = await Municipio.findOne({
                where: {
                    id_estado: idEstadoNum,
                    [Op.or]: [
                        { num_municipio: numMunicipioNum },
                        { municipio: municipioTrim }
                    ],
                    id_municipio: { [Op.ne]: id }
                },
                transaction: t
            });
            if (conflict) {
                const err = new Error('El num_municipio o el nombre del municipio ya existe en ese estado.');
                err.statusCode = 409;
                throw err;
            }

            await record.update({
                id_estado: idEstadoNum,
                num_municipio: numMunicipioNum,
                municipio: municipioTrim
            }, { transaction: t });

            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Municipio actualizado exitosamente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en municipioPut:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/municipios/:id
// Actualizar parcialmente un municipio por ID
// ─────────────────────────────────────────────────────────────────────────────
export const municipioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const { id_estado, num_municipio, municipio } = req.body;

        // Al menos un campo debe estar presente
        const hasAny = id_estado !== undefined || num_municipio !== undefined || municipio !== undefined;
        if (!hasAny) {
            return res.status(400).json({ success: false, message: 'Se debe proporcionar al menos un campo para actualizar.' });
        }

        // Validaciones parciales de tipo
        if (id_estado !== undefined) {
            const v = Number(id_estado);
            if (!Number.isInteger(v) || v <= 0) {
                return res.status(400).json({ success: false, message: 'El campo id_estado debe ser un entero positivo.' });
            }
        }
        if (num_municipio !== undefined) {
            const v = Number(num_municipio);
            if (!Number.isInteger(v) || v <= 0) {
                return res.status(400).json({ success: false, message: 'El campo num_municipio debe ser un entero positivo.' });
            }
        }
        if (municipio !== undefined) {
            if (typeof municipio !== 'string' || municipio.trim() === '') {
                return res.status(400).json({ success: false, message: 'El campo municipio debe ser texto no vacío.' });
            }
            const maxLength = getMaxLength('municipio');
            if (municipio.trim().length > maxLength) {
                return res.status(400).json({ success: false, message: `El campo municipio no puede exceder ${maxLength} caracteres.` });
            }
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await Municipio.findByPk(id, { transaction: t });
            if (!record) return null;

            // Valores objetivo: usar el enviado o mantener el actual
            const targetEstado = id_estado     !== undefined ? Number(id_estado)     : record.id_estado;
            const targetNum    = num_municipio  !== undefined ? Number(num_municipio)  : record.num_municipio;
            const targetName   = municipio      !== undefined ? municipio.trim()       : record.municipio;

            // Si se cambia id_estado, verificar que exista
            if (id_estado !== undefined) {
                const estadoExist = await Estado.findByPk(targetEstado, { transaction: t });
                if (!estadoExist) {
                    const err = new Error('El id_estado proporcionado no existe.');
                    err.statusCode = 404;
                    throw err;
                }
            }

            // Verificar duplicados dentro del mismo estado (excluir registro actual)
            const conflict = await Municipio.findOne({
                where: {
                    id_estado: targetEstado,
                    [Op.or]: [
                        { num_municipio: targetNum },
                        { municipio: targetName }
                    ],
                    id_municipio: { [Op.ne]: id }
                },
                transaction: t
            });
            if (conflict) {
                const err = new Error('El num_municipio o el nombre del municipio ya existe en ese estado.');
                err.statusCode = 409;
                throw err;
            }

            // Construir payload solo con los campos enviados
            const payload = {};
            if (id_estado     !== undefined) payload.id_estado     = targetEstado;
            if (num_municipio !== undefined) payload.num_municipio  = targetNum;
            if (municipio     !== undefined) payload.municipio      = targetName;

            await record.update(payload, { transaction: t });
            return record;
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Municipio actualizado parcialmente.',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en municipioPatch:', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/municipios/:id
// Eliminar un municipio por ID
// ─────────────────────────────────────────────────────────────────────────────
export const municipioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido. Debe ser un entero positivo.' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Municipio.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Municipio eliminado correctamente.',
            data: deleted
        });
    } catch (error) {
        // Manejo específico de violación de FK
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            /foreign key|referenc/i.test(error.message || '')
        ) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el municipio: está referenciado en otros registros.'
            });
        }
        console.error('Error en municipioDelete:', error.message || error);
        return next(error);
    }
};