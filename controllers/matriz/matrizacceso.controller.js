import MatrizAccesos from "../../models/matriz/matrizacceso.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';


// Obtener todos los registros de MatrizAccesos
export const matrizaccesosGet = async (req, res) => {
    const t = await sequelize.transaction(); // iniciar transacción

    try {
        const matrizaccesos = await MatrizAccesos.findAll({
            transaction: t
        });

        await t.commit(); // confirmar consulta
        return res.status(200).json(matrizaccesos);

    } catch (error) {
        await t.rollback(); // revertir si algo falla
        console.error('Error en matrizaccesosGet:', error);

        return res.status(500).json({
            error: 'Error al obtener los registros de MatrizAccesos'
        });
    }
};


// Obtener un registro de MatrizAccesos por ID
export const matrizaccesoGetById = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction(); // iniciar transacción

    try {
        const registro = await MatrizAccesos.findByPk(id, { transaction: t });

        if (!registro) {
            await t.rollback(); // revertir porque no existe
            return res.status(404).json({
                error: `No se encontró el registro con id_matrizacceso = ${id}`
            });
        }

        await t.commit(); // confirmar operación
        return res.status(200).json(registro);

    } catch (error) {
        await t.rollback();
        console.error("Error en matrizaccesoGetById:", error);

        return res.status(500).json({
            error: "Error al obtener el registro de MatrizAccesos"
        });
    }
};


// Crear un nuevo registro de MatrizAccesos
export const matrizaccesoPost = async (req, res) => {
    const { id_tipousuario, id_vista, estatus } = req.body;

    const t = await sequelize.transaction(); // iniciar transacción

    try {
        // Validación simple de parámetros requeridos
        if (
            id_tipousuario === undefined ||
            id_vista === undefined ||
            estatus === undefined
        ) {
            await t.rollback();
            return res.status(400).json({
                error: "Faltan datos obligatorios: id_tipousuario, id_vista, estatus"
            });
        }

        // (opcional) validar duplicado: evitar misma combinación tipousuario-vista
        const existente = await MatrizAccesos.findOne({
            where: { id_tipousuario, id_vista },
            transaction: t
        });

        if (existente) {
            await t.rollback();
            return res.status(409).json({
                error: "Ya existe un registro para este tipo de usuario y vista."
            });
        }

        // Crear registro
        const nuevoRegistro = await MatrizAccesos.create(
            { id_tipousuario, id_vista, estatus },
            { transaction: t }
        );

        await t.commit(); // confirmar registro
        return res.status(201).json(nuevoRegistro);

    } catch (error) {
        await t.rollback();
        console.error("Error en matrizaccesoPost:", error);

        return res.status(500).json({
            error: "Error al crear el registro en MatrizAccesos"
        });
    }
};


// Actualizar un registro de MatrizAccesos por ID
export const matrizaccesoPut = async (req, res) => {
    const { id } = req.params;
    const { id_tipousuario, id_vista, estatus } = req.body;

    const t = await sequelize.transaction(); // iniciar transacción

    try {
        // Validar campos obligatorios
        if (
            id_tipousuario === undefined ||
            id_vista === undefined ||
            estatus === undefined
        ) {
            await t.rollback();
            return res.status(400).json({
                error: "Faltan datos obligatorios: id_tipousuario, id_vista, estatus"
            });
        }

        // Verificar existencia del registro
        const registro = await MatrizAccesos.findByPk(id, { transaction: t });

        if (!registro) {
            await t.rollback();
            return res.status(404).json({
                error: `No existe un registro con id_matrizacceso = ${id}`
            });
        }

        // (Opcional) Verificar duplicado tipoUsuario + vista
        const duplicado = await MatrizAccesos.findOne({
            where: {
                id_tipousuario,
                id_vista,
                id_matrizacceso: { [Op.ne]: id } // excluir el actual
            },
            transaction: t
        });

        if (duplicado) {
            await t.rollback();
            return res.status(409).json({
                error: "Ya existe un registro con esa combinación de tipo de usuario y vista."
            });
        }

        // Actualizar registro
        await registro.update(
            { id_tipousuario, id_vista, estatus },
            { transaction: t }
        );

        await t.commit();
        return res.status(200).json({
            message: "Registro actualizado correctamente",
            registro
        });

    } catch (error) {
        await t.rollback();
        console.error("Error en matrizaccesoPut:", error);

        return res.status(500).json({
            error: "Error al actualizar el registro en MatrizAccesos"
        });
    }
};


// Actualizar parcialmente un registro de MatrizAccesos por ID
export const matrizaccesoPatch = async (req, res) => {
    const { id } = req.params;
    const { id_tipousuario, id_vista, estatus } = req.body;

    const t = await sequelize.transaction(); // iniciar transacción

    try {
        // Verificar existencia del registro
        const registro = await MatrizAccesos.findByPk(id, { transaction: t });

        if (!registro) {
            await t.rollback();
            return res.status(404).json({
                error: `No existe un registro con id_matrizacceso = ${id}`
            });
        }

        // Construir objeto con los campos que realmente vienen en el PATCH
        const camposActualizables = {};
        if (id_tipousuario !== undefined) camposActualizables.id_tipousuario = id_tipousuario;
        if (id_vista !== undefined) camposActualizables.id_vista = id_vista;
        if (estatus !== undefined) camposActualizables.estatus = estatus;

        // Evitar PATCH vacío
        if (Object.keys(camposActualizables).length === 0) {
            await t.rollback();
            return res.status(400).json({
                error: "No se proporcionaron campos para actualizar."
            });
        }

        // (Opcional) Verificar duplicado si se envía combo tipousuario + vista
        if (camposActualizables.id_tipousuario || camposActualizables.id_vista) {
            const nuevoTipo = camposActualizables.id_tipousuario ?? registro.id_tipousuario;
            const nuevaVista = camposActualizables.id_vista ?? registro.id_vista;

            const duplicado = await MatrizAccesos.findOne({
                where: {
                    id_tipousuario: nuevoTipo,
                    id_vista: nuevaVista,
                    id_matrizacceso: { [Op.ne]: id }
                },
                transaction: t
            });

            if (duplicado) {
                await t.rollback();
                return res.status(409).json({
                    error: "Ya existe un registro con esa combinación de tipo de usuario y vista."
                });
            }
        }

        // Actualizar parcialmente
        await registro.update(camposActualizables, { transaction: t });

        await t.commit();
        return res.status(200).json({
            message: "Registro actualizado parcialmente",
            registro
        });

    } catch (error) {
        await t.rollback();
        console.error("Error en matrizaccesoPatch:", error);

        return res.status(500).json({
            error: "Error al actualizar parcialmente el registro en MatrizAccesos"
        });
    }
};


// Eliminar un registro de MatrizAccesos por ID
export const matrizaccesoDelete = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction(); // iniciar transacción

    try {
        // Verificar si el registro existe
        const registro = await MatrizAccesos.findByPk(id, { transaction: t });

        if (!registro) {
            await t.rollback();
            return res.status(404).json({
                error: `No existe un registro con id_matrizacceso = ${id}`
            });
        }

        // Eliminar registro
        await registro.destroy({ transaction: t });

        await t.commit();
        return res.status(200).json({
            message: "Registro eliminado correctamente",
            id_eliminado: id
        });

    } catch (error) {
        await t.rollback();
        console.error("Error en matrizaccesoDelete:", error);

        return res.status(500).json({
            error: "Error al eliminar el registro de MatrizAccesos"
        });
    }
};
