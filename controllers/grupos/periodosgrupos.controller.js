import PeriodosGrupos from "../../models/grupos/periodosgrupos.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// ─── Campos permitidos para ordenamiento ─────────────────────────────────────
const ALLOWED_SORT_FIELDS = [
    'id_periodogrupo', 'id_grupo', 'id_periodo',
    'id_estatus_grupo', 'id_responsable_grupo', 'lugar_imparticion'
];
const DEFAULT_SORT_FIELD = 'id_periodogrupo';

// ─── Helper: parsear entero positivo ─────────────────────────────────────────
const parsePositiveInt = (value) => {
    const n = parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// ─── Helper: validar formato de hora HH:MM o HH:MM:SS ────────────────────────
const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

// ─────────────────────────────────────────────────────────────────────────────
// GET /periodosgrupos  →  lista paginada con filtros y ordenamiento
// ─────────────────────────────────────────────────────────────────────────────
export const periodosgruposGet = async (req, res, next) => {
    try {
        // Paginación segura
        const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // Filtros opcionales por clave foránea
        const where = {};
        const fkFilters = ['id_grupo', 'id_periodo', 'id_estatus_grupo', 'id_responsable_grupo'];
        for (const field of fkFilters) {
            if (req.query[field] !== undefined) {
                const val = parsePositiveInt(req.query[field]);
                if (val === null) {
                    return res.status(400).json({
                        success: false,
                        message: `El parámetro ${field} debe ser un entero positivo`
                    });
                }
                where[field] = val;
            }
        }

        // Filtro de texto en lugar_imparticion
        const q = (req.query.q || '').trim();
        if (q) where.lugar_imparticion = { [Op.like]: `%${q}%` };

        // Ordenamiento seguro
        const [sortField = DEFAULT_SORT_FIELD, sortOrderRaw = 'asc'] =
            (req.query.sort || `${DEFAULT_SORT_FIELD}:asc`).split(':');
        const sortFieldSafe = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : DEFAULT_SORT_FIELD;
        const sortOrder     = sortOrderRaw.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Consulta (lectura: sin transacción explícita)
        const { count, rows } = await PeriodosGrupos.findAndCountAll({
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
        console.error('[periodosgruposGet]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /periodosgrupos/:id  →  registro único por PK
// ─────────────────────────────────────────────────────────────────────────────
export const periodosgrupoGetById = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        // Lectura simple: sin transacción explícita
        const registro = await PeriodosGrupos.findByPk(id);

        if (!registro) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({ success: true, data: registro });
    } catch (error) {
        console.error('[periodogrupoGetById]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /periodosgrupos  →  crear nuevo periodo de grupo
// ─────────────────────────────────────────────────────────────────────────────
export const periodosgrupoPost = async (req, res, next) => {
    try {
        const { id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo, hora_inicio, lugar_imparticion } = req.body;

        // id_estatus_grupo y id_responsable_grupo: obligatorios (allowNull: false en el modelo)
        const idEstatusGrupo    = parsePositiveInt(id_estatus_grupo);
        const idResponsableGrupo = parsePositiveInt(id_responsable_grupo);

        if (idEstatusGrupo === null) {
            return res.status(400).json({ success: false, message: 'El campo id_estatus_grupo es obligatorio y debe ser un entero positivo' });
        }
        if (idResponsableGrupo === null) {
            return res.status(400).json({ success: false, message: 'El campo id_responsable_grupo es obligatorio y debe ser un entero positivo' });
        }

        // id_grupo e id_periodo: opcionales (allowNull: true en el modelo)
        let idGrupoVal = null, idPeriodoVal = null;
        if (id_grupo !== undefined && id_grupo !== null && id_grupo !== '') {
            idGrupoVal = parsePositiveInt(id_grupo);
            if (idGrupoVal === null) {
                return res.status(400).json({ success: false, message: 'El campo id_grupo debe ser un entero positivo' });
            }
        }
        if (id_periodo !== undefined && id_periodo !== null && id_periodo !== '') {
            idPeriodoVal = parsePositiveInt(id_periodo);
            if (idPeriodoVal === null) {
                return res.status(400).json({ success: false, message: 'El campo id_periodo debe ser un entero positivo' });
            }
        }

        // hora_inicio: opcional — formato HH:MM o HH:MM:SS
        let horaInicioVal = null;
        if (hora_inicio !== undefined && hora_inicio !== null && hora_inicio !== '') {
            if (!isValidTime(hora_inicio)) {
                return res.status(400).json({ success: false, message: 'El campo hora_inicio debe tener formato HH:MM o HH:MM:SS' });
            }
            horaInicioVal = hora_inicio;
        }

        // lugar_imparticion: opcional — cadena máx. 250 caracteres
        let lugarImparticionVal = null;
        if (lugar_imparticion !== undefined && lugar_imparticion !== null && lugar_imparticion !== '') {
            if (typeof lugar_imparticion !== 'string') {
                return res.status(400).json({ success: false, message: 'El campo lugar_imparticion debe ser una cadena de texto' });
            }
            lugarImparticionVal = lugar_imparticion.trim();
            if (lugarImparticionVal.length > 250) {
                return res.status(400).json({ success: false, message: 'El campo lugar_imparticion no puede exceder 250 caracteres' });
            }
        }

        // Verificar duplicado de la combinación clave
        const existe = await PeriodosGrupos.findOne({
            where: {
                id_grupo:             idGrupoVal,
                id_periodo:           idPeriodoVal,
                id_estatus_grupo:     idEstatusGrupo,
                id_responsable_grupo: idResponsableGrupo
            }
        });
        if (existe) {
            return res.status(409).json({ success: false, message: 'Ya existe un periodo de grupo con los mismos datos' });
        }

        // Crear dentro de transacción
        const nuevo = await sequelize.transaction(async (t) => {
            return await PeriodosGrupos.create(
                {
                    id_grupo:             idGrupoVal,
                    id_periodo:           idPeriodoVal,
                    id_estatus_grupo:     idEstatusGrupo,
                    id_responsable_grupo: idResponsableGrupo,
                    hora_inicio:          horaInicioVal,
                    lugar_imparticion:    lugarImparticionVal
                },
                { transaction: t }
            );
        });

        return res.status(201).json({
            success: true,
            message: 'Periodo de grupo creado exitosamente',
            data: nuevo
        });
    } catch (error) {
        console.error('[periodogrupoPost]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /periodosgrupos/:id  →  reemplazo total del registro
// ─────────────────────────────────────────────────────────────────────────────
export const periodosgrupoPut = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const { id_grupo, id_periodo, id_estatus_grupo, id_responsable_grupo, hora_inicio, lugar_imparticion } = req.body;

        // Obligatorios en PUT
        const idEstatusGrupo     = parsePositiveInt(id_estatus_grupo);
        const idResponsableGrupo = parsePositiveInt(id_responsable_grupo);

        if (idEstatusGrupo === null) {
            return res.status(400).json({ success: false, message: 'El campo id_estatus_grupo es obligatorio y debe ser un entero positivo' });
        }
        if (idResponsableGrupo === null) {
            return res.status(400).json({ success: false, message: 'El campo id_responsable_grupo es obligatorio y debe ser un entero positivo' });
        }

        // Opcionales (nullables)
        let idGrupoVal = null, idPeriodoVal = null;
        if (id_grupo !== undefined && id_grupo !== null && id_grupo !== '') {
            idGrupoVal = parsePositiveInt(id_grupo);
            if (idGrupoVal === null) {
                return res.status(400).json({ success: false, message: 'El campo id_grupo debe ser un entero positivo' });
            }
        }
        if (id_periodo !== undefined && id_periodo !== null && id_periodo !== '') {
            idPeriodoVal = parsePositiveInt(id_periodo);
            if (idPeriodoVal === null) {
                return res.status(400).json({ success: false, message: 'El campo id_periodo debe ser un entero positivo' });
            }
        }

        // hora_inicio opcional
        let horaInicioVal = null;
        if (hora_inicio !== undefined && hora_inicio !== null && hora_inicio !== '') {
            if (!isValidTime(hora_inicio)) {
                return res.status(400).json({ success: false, message: 'El campo hora_inicio debe tener formato HH:MM o HH:MM:SS' });
            }
            horaInicioVal = hora_inicio;
        }

        // lugar_imparticion opcional
        let lugarImparticionVal = null;
        if (lugar_imparticion !== undefined && lugar_imparticion !== null && lugar_imparticion !== '') {
            if (typeof lugar_imparticion !== 'string') {
                return res.status(400).json({ success: false, message: 'El campo lugar_imparticion debe ser una cadena de texto' });
            }
            lugarImparticionVal = lugar_imparticion.trim();
            if (lugarImparticionVal.length > 250) {
                return res.status(400).json({ success: false, message: 'El campo lugar_imparticion no puede exceder 250 caracteres' });
            }
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await PeriodosGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Verificar duplicado de la combinación clave (excluyendo el propio registro)
            const duplicado = await PeriodosGrupos.findOne({
                where: {
                    id_grupo:             idGrupoVal,
                    id_periodo:           idPeriodoVal,
                    id_estatus_grupo:     idEstatusGrupo,
                    id_responsable_grupo: idResponsableGrupo,
                    id_periodogrupo:      { [Op.ne]: id }
                },
                transaction: t
            });
            if (duplicado) {
                const err = new Error('Ya existe un periodo de grupo con los mismos datos');
                err.statusCode = 409;
                throw err;
            }

            await registro.update(
                {
                    id_grupo:             idGrupoVal,
                    id_periodo:           idPeriodoVal,
                    id_estatus_grupo:     idEstatusGrupo,
                    id_responsable_grupo: idResponsableGrupo,
                    hora_inicio:          horaInicioVal,
                    lugar_imparticion:    lugarImparticionVal
                },
                { transaction: t }
            );
            return await PeriodosGrupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo de grupo actualizado exitosamente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[periodogrupoPut]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /periodosgrupos/:id  →  actualización parcial del registro
// ─────────────────────────────────────────────────────────────────────────────
export const periodosgrupoPatch = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const camposPermitidos = [
            'id_grupo', 'id_periodo', 'id_estatus_grupo',
            'id_responsable_grupo', 'hora_inicio', 'lugar_imparticion'
        ];
        const camposRecibidos = Object.keys(req.body).filter(k => camposPermitidos.includes(k));

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Se requiere al menos uno de los campos: ${camposPermitidos.join(', ')}`
            });
        }

        // Construir objeto de cambios validados
        const cambios = {};

        // Claves foráneas enteras: id_grupo e id_periodo son nullables
        if ('id_grupo' in req.body) {
            const raw = req.body.id_grupo;
            if (raw === null || raw === '') {
                cambios.id_grupo = null;
            } else {
                const val = parsePositiveInt(raw);
                if (val === null) return res.status(400).json({ success: false, message: 'El campo id_grupo debe ser un entero positivo o null' });
                cambios.id_grupo = val;
            }
        }
        if ('id_periodo' in req.body) {
            const raw = req.body.id_periodo;
            if (raw === null || raw === '') {
                cambios.id_periodo = null;
            } else {
                const val = parsePositiveInt(raw);
                if (val === null) return res.status(400).json({ success: false, message: 'El campo id_periodo debe ser un entero positivo o null' });
                cambios.id_periodo = val;
            }
        }
        // Claves foráneas obligatorias (allowNull: false): si se envían, deben ser positivas
        if ('id_estatus_grupo' in req.body) {
            const val = parsePositiveInt(req.body.id_estatus_grupo);
            if (val === null) return res.status(400).json({ success: false, message: 'El campo id_estatus_grupo debe ser un entero positivo' });
            cambios.id_estatus_grupo = val;
        }
        if ('id_responsable_grupo' in req.body) {
            const val = parsePositiveInt(req.body.id_responsable_grupo);
            if (val === null) return res.status(400).json({ success: false, message: 'El campo id_responsable_grupo debe ser un entero positivo' });
            cambios.id_responsable_grupo = val;
        }

        // hora_inicio: nullable, validar formato si se envía
        if ('hora_inicio' in req.body) {
            const raw = req.body.hora_inicio;
            if (raw === null || raw === '') {
                cambios.hora_inicio = null;
            } else {
                if (!isValidTime(raw)) {
                    return res.status(400).json({ success: false, message: 'El campo hora_inicio debe tener formato HH:MM o HH:MM:SS' });
                }
                cambios.hora_inicio = raw;
            }
        }

        // lugar_imparticion: nullable, validar longitud si se envía
        if ('lugar_imparticion' in req.body) {
            const raw = req.body.lugar_imparticion;
            if (raw === null || raw === '') {
                cambios.lugar_imparticion = null;
            } else {
                if (typeof raw !== 'string') {
                    return res.status(400).json({ success: false, message: 'El campo lugar_imparticion debe ser una cadena de texto' });
                }
                const trimmed = raw.trim();
                if (trimmed.length > 250) {
                    return res.status(400).json({ success: false, message: 'El campo lugar_imparticion no puede exceder 250 caracteres' });
                }
                cambios.lugar_imparticion = trimmed;
            }
        }

        const actualizado = await sequelize.transaction(async (t) => {
            const registro = await PeriodosGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            // Resolver valores finales de la clave compuesta para el check de duplicado
            const idGrupoFinal    = 'id_grupo'             in cambios ? cambios.id_grupo             : registro.id_grupo;
            const idPeriodoFinal  = 'id_periodo'           in cambios ? cambios.id_periodo           : registro.id_periodo;
            const idEstatusFinal  = 'id_estatus_grupo'     in cambios ? cambios.id_estatus_grupo     : registro.id_estatus_grupo;
            const idRespFinal     = 'id_responsable_grupo' in cambios ? cambios.id_responsable_grupo : registro.id_responsable_grupo;

            // Siempre verificar duplicado de clave compuesta si alguno de sus campos cambió
            const cambiaClaveCompuesta =
                'id_grupo'             in cambios ||
                'id_periodo'           in cambios ||
                'id_estatus_grupo'     in cambios ||
                'id_responsable_grupo' in cambios;

            if (cambiaClaveCompuesta) {
                const duplicado = await PeriodosGrupos.findOne({
                    where: {
                        id_grupo:             idGrupoFinal,
                        id_periodo:           idPeriodoFinal,
                        id_estatus_grupo:     idEstatusFinal,
                        id_responsable_grupo: idRespFinal,
                        id_periodogrupo:      { [Op.ne]: id }
                    },
                    transaction: t
                });
                if (duplicado) {
                    const err = new Error('Ya existe un periodo de grupo con los mismos datos');
                    err.statusCode = 409;
                    throw err;
                }
            }

            await registro.update(cambios, { transaction: t });
            return await PeriodosGrupos.findByPk(id, { transaction: t });
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo de grupo actualizado parcialmente',
            data: actualizado
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('[periodogrupoPatch]', error.message || error);
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /periodosgrupos/:id  →  eliminar registro por PK
// ─────────────────────────────────────────────────────────────────────────────
export const periodosgrupoDelete = async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (id === null) {
            return res.status(400).json({ success: false, message: 'ID inválido: debe ser un entero positivo' });
        }

        const eliminado = await sequelize.transaction(async (t) => {
            const registro = await PeriodosGrupos.findByPk(id, { transaction: t });
            if (!registro) return null;

            const snapshot = registro.get({ plain: true });
            await registro.destroy({ transaction: t });
            return snapshot;
        });

        if (!eliminado) {
            return res.status(404).json({ success: false, message: 'Periodo de grupo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Periodo de grupo eliminado correctamente',
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
                message: 'No se puede eliminar: el periodo de grupo está referenciado en otras tablas'
            });
        }
        console.error('[periodogrupoDelete]', error.message || error);
        return next(error);
    }
};
