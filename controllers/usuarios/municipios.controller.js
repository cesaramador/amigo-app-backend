import Municipio from "../../models/usuarios/municipios.model.js";
import Estado from "../../models/usuarios/estados.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Leer todos los municipios
export const municipiosGet = async (req, res, next) => {
    try {
        // Paginación
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda por nombre
        const q = (req.query.q || '').trim();
        const where = q ? { municipio: { [Op.like]: `%${q}%` } } : {};

        // Orden seguro
        const [sortField = 'id_municipio', sortOrderRaw = 'asc'] = (req.query.sort || 'id_municipio:asc').split(':');
        const allowedSortFields = ['id_municipio', 'municipio'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_municipio';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Ejecutar consulta con transacción
        const municipios = await sequelize.transaction(async (t) => {
            return await Municipio.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortFieldSafe, sortOrder]],
                transaction: t
            });
        });

        const total = municipios.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            message: 'Municipios obtenidos exitosamente',
            meta: {
                total,
                page,
                pages,
                limit,
                sort: `${sortFieldSafe}:${sortOrder}`
            },
            data: municipios.rows
        });
    } catch (error) {
        console.error('Error en municipiosGet:', error.message || error);
        return next(error);
    }
}

// Leer un municipio por id
export const municipioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'ID inválido' 
            });
        }

        // Buscar municipio con transacción
        const municipio = await sequelize.transaction(async (t) => {
            return await Municipio.findByPk(id, {
                transaction: t
            });
        });

        if (!municipio) {
            return res.status(404).json({ 
                success: false,
                message: 'Municipio no encontrado' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Municipio obtenido exitosamente',
            data: municipio
        });
    } catch (error) {
        console.error('Error en municipiosGetById:', error.message || error);
        return next(error);
    }
}

// Crear un nuevo municipio
export const municipioPost = async (req, res, next) => {
    try {
        const { id_estado, num_municipio, municipio } = req.body;

        // validaciones básicas
        if (!Number.isInteger(Number(id_estado)) || Number(id_estado) <= 0) {
            return res.status(400).json({ success: false, message: 'id_estado inválido' });
        }
        if (!Number.isInteger(Number(num_municipio)) || Number(num_municipio) <= 0) {
            return res.status(400).json({ success: false, message: 'num_municipio inválido' });
        }
        if (!municipio || typeof municipio !== 'string' || municipio.trim() === '') {
            return res.status(400).json({ success: false, message: 'municipio es obligatorio' });
        }

        const attrs = Municipio.rawAttributes || {};
        const maxLen = attrs.municipio?.type?.options?.length ?? attrs.municipio?._length ?? 100;
        if (String(municipio).trim().length > maxLen) {
            return res.status(400).json({ success: false, message: `municipio supera ${maxLen} caracteres` });
        }

        // Verificar existencia de estado si el modelo relaciona por id_estado
        // intenta cargar Estado si existe en el proyecto (no obligatorio)
        // try {
        //     // eslint-disable-next-line no-unused-vars
        //     const Estado = (await import('../../models/usuarios/estados.model.js')).default;
        //     const estadoExist = await Estado.findByPk(id_estado);
        //     if (!estadoExist) {
        //         return res.status(404).json({ success: false, message: 'id_estado no existe' });
        //     }
        // } catch (e) {
        //     // si no existe el modelo Estado en runtime, seguimos sin validarlo
        // }

        // verificar duplicados: mismo id_estado + num_municipio o mismo nombre en el mismo estado
        const conflict = await Municipio.findOne({
            where: {
                id_estado: Number(id_estado),
                [Op.or]: [
                    { num_municipio: Number(num_municipio) },
                    { municipio: String(municipio).trim() }
                ]
            }
        });
        if (conflict) {
            return res.status(409).json({ success: false, message: 'Municipio duplicado (número o nombre ya existe en el estado)' });
        }

        // crear municipio dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            const created = await Municipio.create({
                id_estado: Number(id_estado),
                num_municipio: Number(num_municipio),
                municipio: String(municipio).trim()
            }, { transaction: t });

            return created;
        });

        const payloadOut = nuevo.get({ plain: true });
        return res.status(201).json({ success: true, message: 'Municipio creado exitosamente', data: payloadOut });
    } catch (error) {
        console.error('Error en municipiosPost:', error.message || error);
        return next(error);
    }
}

export const municipioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { id_estado, num_municipio, municipio } = req.body;

        // En PUT solemos requerir los campos principales
        if (
            id_estado === undefined ||
            num_municipio === undefined ||
            municipio === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren id_estado, num_municipio y municipio'
            });
        }

        // Validaciones básicas de tipos/valores
        const idEstadoNum = Number(id_estado);
        const numMunicipioNum = Number(num_municipio);
        if (!Number.isInteger(idEstadoNum) || idEstadoNum <= 0) {
            return res.status(400).json({ success: false, message: 'id_estado inválido' });
        }
        if (!Number.isInteger(numMunicipioNum) || numMunicipioNum <= 0) {
            return res.status(400).json({ success: false, message: 'num_municipio inválido' });
        }
        if (typeof municipio !== 'string' || municipio.trim() === '') {
            return res.status(400).json({ success: false, message: 'municipio inválido' });
        }
        const municipioTrim = municipio.trim();

        // extraer longitud desde el modelo si existe
        const attrs = Municipio.rawAttributes || {};
        const maxLength = attrs.municipio?.type?.options?.length ?? attrs.municipio?._length ?? 100;
        if (municipioTrim.length > maxLength) {
            return res.status(400).json({ success: false, message: `municipio supera ${maxLength} caracteres` });
        }

        // Ejecutar actualización dentro de transacción
        const updated = await sequelize.transaction(async (t) => {
            const record = await Municipio.findByPk(id, { transaction: t });
            if (!record) return null;

            // Verificar existencia del estado nuevo
            const estadoExist = await Estado.findByPk(idEstadoNum, { transaction: t });
            if (!estadoExist) {
                const err = new Error('id_estado no existe');
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
                const err = new Error('Conflicto: num_municipio o municipio ya existe en el estado');
                err.statusCode = 409;
                throw err;
            }

            // Actualizar campos
            await record.update({
                id_estado: idEstadoNum,
                num_municipio: numMunicipioNum,
                municipio: municipioTrim
            }, { transaction: t });

            return await Municipio.findByPk(id, { transaction: t });
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Municipio actualizado exitosamente',
            data: updated
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Error en municipiosPut:', error.message || error);
        return next(error);
    }
}

// Actualizar parcialmente un municipio por id
// export const municipiosPatch = async (req, res, next) => {
//     try {
//         const id = Number(req.params.id);
//         if (!Number.isInteger(id) || id <= 0) {
//             return res.status(400).json({ success: false, message: 'ID inválido' });
//         }

//         const { municipio } = req.body;
//         if (typeof municipio === 'undefined') {
//             return res.status(400).json({ success: false, message: 'Campo "municipio" requerido' });
//         }
//         if (typeof municipio !== 'string' || municipio.trim() === '') {
//             return res.status(400).json({ success: false, message: 'Campo "municipio" inválido' });
//         }
//         const value = municipio.trim();

//         // extraer longitud desde el modelo si existe
//         const attrs = Municipio.rawAttributes || {};
//         const maxLength = attrs.municipio?.type?.options?.length ?? 100;
//         if (value.length > maxLength) {
//             return res.status(400).json({ success: false, message: `El campo municipio no puede exceder ${maxLength} caracteres` });
//         }

//         // Actualizar dentro de transacción (verifica existencia y unicidad)
//         const updated = await sequelize.transaction(async (t) => {
//             const record = await Municipio.findByPk(id, { transaction: t });
//             if (!record) return null;

//             if (record.municipio !== value) {
//                 const duplicate = await Municipio.findOne({ where: { municipio: value }, transaction: t });
//                 if (duplicate) {
//                     const err = new Error('El municipio ya existe');
//                     err.statusCode = 409;
//                     throw err;
//                 }
//             }

//             await record.update({ municipio: value }, { transaction: t });
//             return await Municipio.findByPk(id, { transaction: t });
//         });

//         if (updated === null) {
//             return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
//         }

//         return res.status(200).json({
//             success: true,
//             message: 'Municipio actualizado parcialmente',
//             data: updated
//         });
//     } catch (error) {
//         if (error.statusCode === 409) {
//             return res.status(409).json({ success: false, message: error.message });
//         }
//         console.error('Error en municipiosPatch:', error.message || error);
//         return next(error);
//     }
// }

export const municipioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Campos permitidos en PATCH
        const { id_estado, num_municipio, municipio } = req.body;
        const hasAny = id_estado !== undefined || num_municipio !== undefined || municipio !== undefined;
        if (!hasAny) {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }

        // Validaciones parciales
        if (id_estado !== undefined && (!Number.isInteger(Number(id_estado)) || Number(id_estado) <= 0)) {
            return res.status(400).json({ success: false, message: 'id_estado inválido' });
        }
        if (num_municipio !== undefined && (!Number.isInteger(Number(num_municipio)) || Number(num_municipio) <= 0)) {
            return res.status(400).json({ success: false, message: 'num_municipio inválido' });
        }
        if (municipio !== undefined && (typeof municipio !== 'string' || municipio.trim() === '')) {
            return res.status(400).json({ success: false, message: 'municipio inválido' });
        }

        const attrs = Municipio.rawAttributes || {};
        const maxLength = attrs.municipio?.type?.options?.length ?? attrs.municipio?._length ?? 100;
        if (municipio !== undefined && municipio.trim().length > maxLength) {
            return res.status(400).json({ success: false, message: `municipio supera ${maxLength} caracteres` });
        }

        const updated = await sequelize.transaction(async (t) => {
            const record = await Municipio.findByPk(id, { transaction: t });
            if (!record) return null;

            // Determinar el id_estado objetivo (si no se provee, usar el actual)
            const targetEstado = id_estado !== undefined ? Number(id_estado) : record.id_estado;
            const targetNum = num_municipio !== undefined ? Number(num_municipio) : record.num_municipio;
            const targetName = municipio !== undefined ? municipio.trim() : record.municipio;

            // Si se cambia id_estado, verificar que exista
            if (id_estado !== undefined) {
                const estadoExist = await Estado.findByPk(targetEstado, { transaction: t });
                if (!estadoExist) {
                    const err = new Error('id_estado no existe');
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
                const err = new Error('Conflicto: num_municipio o municipio ya existe en el estado');
                err.statusCode = 409;
                throw err;
            }

            // Construir payload de actualización
            const payload = {};
            if (id_estado !== undefined) payload.id_estado = targetEstado;
            if (num_municipio !== undefined) payload.num_municipio = targetNum;
            if (municipio !== undefined) payload.municipio = targetName;

            await record.update(payload, { transaction: t });

            return await Municipio.findByPk(id, { transaction: t });
        });

        if (updated === null) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Municipio actualizado parcialmente', data: updated });
    } catch (error) {
        if (error.statusCode === 404) return res.status(404).json({ success: false, message: error.message });
        if (error.statusCode === 409) return res.status(409).json({ success: false, message: error.message });
        console.error('Error en municipiosPatch:', error.message || error);
        return next(error);
    }
}

// Eliminar un genero por id
export const municipioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleted = await sequelize.transaction(async (t) => {
            const record = await Municipio.findByPk(id, { transaction: t });
            if (!record) return null;

            const snapshot = record.get({ plain: true });
            await record.destroy({ transaction: t });
            return snapshot;
        });

        if (deleted === null) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Municipio eliminado correctamente',
            data: deleted
        });
    } catch (error) {
        // Manejo específico de FK constraint
        if (error.name === 'SequelizeForeignKeyConstraintError' || /foreign key|referenc/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el municipio: existen referencias en otras tablas'
            });
        }
        return next(error);
    }
}