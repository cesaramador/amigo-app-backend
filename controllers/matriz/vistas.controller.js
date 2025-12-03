import Vistas from "../../models/matriz/vistas.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';

// Obtener todas las vistas
export const vistasGet = async (req, res) => {
    const t = await sequelize.transaction(); // iniciar transacción

    try {
        const vistas = await Vistas.findAll({
            transaction: t
        });

        await t.commit(); // confirmar transacción

        return res.status(200).json(vistas);

    } catch (error) {
        await t.rollback(); // revertir si hay error
        console.error("Error en vistasGet:", error);
        return res.status(500).json({
            error: "Error al obtener las vistas"
        });
    }
};


// Obtener una vista por ID
export const vistaGetById = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction(); // iniciar transacción

    try {
        const vista = await Vistas.findByPk(id, { transaction: t });

        if (!vista) {
            await t.rollback(); // revertir antes de responder
            return res.status(404).json({ error: 'Vista no encontrada' });
        }

        await t.commit(); // confirmar transacción
        return res.status(200).json(vista);

    } catch (error) {
        await t.rollback(); // revertir cambios ante error
        console.error("Error en vistaGetById:", error);

        return res.status(500).json({
            error: 'Error al obtener la vista'
        });
    }
};


// Crear una nueva vista
// Crear una nueva vista
export const vistaPost = async (req, res, next) => {
    let transaction;
    
    try {
        // Validar que existan datos en el body
        if (!req.body || Object.keys(req.body).length === 0) {
            const error = new Error('Datos de la vista requeridos');
            error.statusCode = 400;
            return next(error);
        }

        const { vista } = req.body;

        // Validar campo obligatorio
        if (!vista || vista.trim() === '') {
            const error = new Error('El campo "vista" es obligatorio');
            error.statusCode = 400;
            return next(error);
        }

        // Validar longitud del campo
        if (vista.length > 20) {
            const error = new Error('El campo "vista" no puede exceder los 255 caracteres');
            error.statusCode = 400;
            return next(error);
        }

        // Iniciar transacción
        transaction = await sequelize.transaction();

        // Verificar si la vista ya existe (opcional, si quieres evitar duplicados)
        const vistaExistente = await Vistas.findOne({
            where: { 
                vista: { 
                    [Op.iLike]: vista // Búsqueda case-insensitive
                }
            },
            transaction
        });

        if (vistaExistente) {
            await transaction.rollback();
            const error = new Error('La vista ya existe');
            error.statusCode = 409;
            return next(error);
        }

        // Crear la nueva vista dentro de la transacción
        const nuevaVista = await Vistas.create({ 
            vista: vista.trim() 
        }, { 
            transaction 
        });

        // Confirmar transacción
        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: 'Vista creada exitosamente',
            data: nuevaVista
        });

    } catch (error) {
        // Rollback en caso de error
        if (transaction) {
            await transaction.rollback();
        }
        
        console.error('Error en vistaPost:', error.message || error);
        
        // Manejar errores específicos de Sequelize
        if (error.name === 'SequelizeValidationError') {
            error.message = 'Error de validación en los datos de la vista';
            error.statusCode = 400;
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            error.message = 'La vista ya existe';
            error.statusCode = 409;
        } else if (error.name === 'SequelizeDatabaseError') {
            error.message = 'Error en la base de datos';
            error.statusCode = 500;
        }
        
        // Usar el middleware de errores
        return next(error);
    }
};

// Actualizar una vista por ID
// Actualizar una vista por ID
// Actualizar una vista por ID
export const vistaPut = async (req, res, next) => {
    let transaction;
    
    try {
        // Validar parámetro ID
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            const error = new Error('ID de vista inválido');
            error.statusCode = 400;
            return next(error);
        }

        const vistaId = parseInt(id);

        // Validar que existan datos en el body
        if (!req.body || Object.keys(req.body).length === 0) {
            const error = new Error('Datos para actualizar requeridos');
            error.statusCode = 400;
            return next(error);
        }

        const { vista } = req.body;

        // Validar campo obligatorio
        if (!vista || vista.trim() === '') {
            const error = new Error('El campo "vista" es obligatorio');
            error.statusCode = 400;
            return next(error);
        }

        // Validar longitud del campo según el modelo (20 caracteres)
        if (vista.length > 20) {
            const error = new Error('El campo "vista" no puede exceder los 20 caracteres');
            error.statusCode = 400;
            return next(error);
        }

        // Iniciar transacción
        transaction = await sequelize.transaction();

        // Verificar si la vista existe usando id_vista como clave primaria
        const vistaExistente = await Vistas.findOne({
            where: { id_vista: vistaId },
            transaction
        });

        if (!vistaExistente) {
            await transaction.rollback();
            const error = new Error('Vista no encontrada');
            error.statusCode = 404;
            return next(error);
        }

        // Verificar si el nuevo nombre de vista ya existe (excluyendo la actual)
        const vistaDuplicada = await Vistas.findOne({
            where: { 
                id_vista: { [Op.ne]: vistaId }, // Excluir la vista actual
                vista: { [Op.iLike]: vista.trim() } // Búsqueda case-insensitive
            },
            transaction
        });

        if (vistaDuplicada) {
            await transaction.rollback();
            const error = new Error('Ya existe otra vista con ese nombre');
            error.statusCode = 409;
            return next(error);
        }

        // Actualizar la vista
        const [filasActualizadas] = await Vistas.update(
            { 
                vista: vista.trim()
            }, 
            { 
                where: { id_vista: vistaId },
                transaction
            }
        );

        if (filasActualizadas === 0) {
            // Esto no debería pasar debido a la verificación previa, pero lo manejamos por seguridad
            await transaction.rollback();
            const error = new Error('No se pudo actualizar la vista');
            error.statusCode = 500;
            return next(error);
        }

        // Obtener la vista actualizada
        const vistaActualizada = await Vistas.findOne({
            where: { id_vista: vistaId },
            transaction
        });

        // Confirmar transacción
        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Vista actualizada correctamente',
            data: vistaActualizada
        });

    } catch (error) {
        // Rollback en caso de error
        if (transaction) {
            await transaction.rollback();
        }
        
        console.error('Error en vistaPut:', error.message || error);
        
        // Manejar errores específicos de Sequelize
        if (error.name === 'SequelizeValidationError') {
            error.message = 'Error de validación en los datos de la vista';
            error.statusCode = 400;
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            error.message = 'Ya existe otra vista con ese nombre';
            error.statusCode = 409;
        } else if (error.name === 'SequelizeDatabaseError') {
            error.message = 'Error en la base de datos';
            error.statusCode = 500;
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            error.message = 'No se puede actualizar debido a restricciones de integridad referencial';
            error.statusCode = 409;
        }
        
        // Usar el middleware de errores
        return next(error);
    }
};


// Actualizar parcialmente una vista por ID
// Actualizar parcialmente una vista por ID
export const vistaPatch = async (req, res, next) => {
    let transaction;
    
    try {
        // Validar parámetro ID
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            const error = new Error('ID de vista inválido');
            error.statusCode = 400;
            return next(error);
        }

        const vistaId = parseInt(id);

        // Validar que existan datos en el body
        if (!req.body || Object.keys(req.body).length === 0) {
            const error = new Error('Datos para actualizar requeridos');
            error.statusCode = 400;
            return next(error);
        }

        const { vista } = req.body;

        // Para PATCH, el campo no es obligatorio (solo actualizar si se proporciona)
        if (vista === undefined) {
            const error = new Error('No se proporcionaron campos para actualizar');
            error.statusCode = 400;
            return next(error);
        }

        // Si se proporciona el campo vista, validarlo
        let datosActualizar = {};
        
        if (vista !== undefined) {
            if (vista === null || vista === '') {
                const error = new Error('El campo "vista" no puede estar vacío');
                error.statusCode = 400;
                return next(error);
            }
            
            // Validar longitud del campo según el modelo (20 caracteres)
            if (vista.length > 20) {
                const error = new Error('El campo "vista" no puede exceder los 20 caracteres');
                error.statusCode = 400;
                return next(error);
            }
            
            datosActualizar.vista = vista.trim();
        }

        // Verificar que haya al menos un campo para actualizar
        if (Object.keys(datosActualizar).length === 0) {
            const error = new Error('No se proporcionaron campos válidos para actualizar');
            error.statusCode = 400;
            return next(error);
        }

        // Iniciar transacción
        transaction = await sequelize.transaction();

        // Verificar si la vista existe usando id_vista como clave primaria
        const vistaExistente = await Vistas.findOne({
            where: { id_vista: vistaId },
            transaction
        });

        if (!vistaExistente) {
            await transaction.rollback();
            const error = new Error('Vista no encontrada');
            error.statusCode = 404;
            return next(error);
        }

        // Si se está actualizando el nombre de la vista, verificar duplicados
        if (datosActualizar.vista) {
            const vistaDuplicada = await Vistas.findOne({
                where: { 
                    id_vista: { [Op.ne]: vistaId }, // Excluir la vista actual
                    vista: { [Op.iLike]: datosActualizar.vista } // Búsqueda case-insensitive
                },
                transaction
            });

            if (vistaDuplicada) {
                await transaction.rollback();
                const error = new Error('Ya existe otra vista con ese nombre');
                error.statusCode = 409;
                return next(error);
            }

            // Verificar si el valor actual es diferente (optimización)
            if (vistaExistente.vista.toLowerCase() === datosActualizar.vista.toLowerCase()) {
                await transaction.rollback();
                return res.status(200).json({
                    success: true,
                    message: 'La vista ya tiene el mismo valor',
                    data: vistaExistente
                });
            }
        }

        // Actualizar la vista
        const [filasActualizadas] = await Vistas.update(
            datosActualizar, 
            { 
                where: { id_vista: vistaId },
                transaction
            }
        );

        if (filasActualizadas === 0) {
            // Esto no debería pasar debido a las verificaciones previas
            await transaction.rollback();
            const error = new Error('No se pudo actualizar la vista');
            error.statusCode = 500;
            return next(error);
        }

        // Obtener la vista actualizada
        const vistaActualizada = await Vistas.findOne({
            where: { id_vista: vistaId },
            transaction
        });

        // Confirmar transacción
        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Vista actualizada parcialmente correctamente',
            data: vistaActualizada,
            camposActualizados: Object.keys(datosActualizar)
        });

    } catch (error) {
        // Rollback en caso de error
        if (transaction) {
            await transaction.rollback();
        }
        
        console.error('Error en vistaPatch:', error.message || error);
        
        // Manejar errores específicos de Sequelize
        if (error.name === 'SequelizeValidationError') {
            const errores = error.errors.map(err => err.message).join(', ');
            error.message = `Error de validación: ${errores}`;
            error.statusCode = 400;
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            error.message = 'Ya existe otra vista con ese nombre';
            error.statusCode = 409;
        } else if (error.name === 'SequelizeDatabaseError') {
            error.message = 'Error en la base de datos';
            error.statusCode = 500;
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            error.message = 'No se puede actualizar debido a restricciones de integridad referencial';
            error.statusCode = 409;
        }
        
        // Usar el middleware de errores
        return next(error);
    }
};

// Eliminar una vista por ID
// Eliminar una vista por ID
export const vistaDelete = async (req, res, next) => {
    let transaction;
    
    try {
        // Validar parámetro ID
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            const error = new Error('ID de vista inválido');
            error.statusCode = 400;
            return next(error);
        }

        const vistaId = parseInt(id);

        // Validar que no sea una vista del sistema (opcional, si tienes vistas protegidas)
        // const vistasProtegidas = [1, 2, 3]; // IDs de vistas que no se pueden eliminar
        // if (vistasProtegidas.includes(vistaId)) {
        //     const error = new Error('No se puede eliminar una vista del sistema');
        //     error.statusCode = 403;
        //     return next(error);
        // }

        // Iniciar transacción
        transaction = await sequelize.transaction();

        // Verificar si la vista existe usando id_vista como clave primaria
        const vistaExistente = await Vistas.findOne({
            where: { id_vista: vistaId },
            transaction,
            lock: transaction.LOCK.UPDATE // Bloqueo para evitar condiciones de carrera
        });

        if (!vistaExistente) {
            await transaction.rollback();
            const error = new Error('Vista no encontrada');
            error.statusCode = 404;
            return next(error);
        }

        // Registrar información de la vista antes de eliminarla (para auditoría)
        const vistaInfo = {
            id_vista: vistaExistente.id_vista,
            vista: vistaExistente.vista
        };

        // Verificar dependencias referenciales (si tienes otras tablas que referencian Vistas)
        // IMPORTANTE: Verificar el modelo MatrizAccesos mencionado en el comentario
        try {
            // Descomenta y adapta esto si tienes la tabla MatrizAccesos u otras dependencias
            // const MatrizAccesos = require('../../models/matriz/matriz_accesos.model.js');
            // const tieneDependencias = await MatrizAccesos.count({
            //     where: { id_vista: vistaId },
            //     transaction
            // });
            
            // if (tieneDependencias > 0) {
            //     await transaction.rollback();
            //     const error = new Error(`No se puede eliminar la vista porque tiene ${tieneDependencias} registro(s) asociado(s) en MatrizAccesos`);
            //     error.statusCode = 409;
            //     error.data = { 
            //         vista: vistaInfo,
            //         dependencias: tieneDependencias 
            //     };
            //     return next(error);
            // }
            
            // Si usas CASCADE en las FK, puedes eliminar automáticamente las dependencias
            // const dependenciasEliminadas = await MatrizAccesos.destroy({
            //     where: { id_vista: vistaId },
            //     transaction
            // });
            // console.log(`Eliminadas ${dependenciasEliminadas} dependencias de MatrizAccesos`);
            
        } catch (errorDependencias) {
            await transaction.rollback();
            console.error('Error al verificar dependencias:', errorDependencias);
            errorDependencias.message = 'Error al verificar dependencias de la vista';
            errorDependencias.statusCode = 500;
            return next(errorDependencias);
        }

        // Eliminar la vista
        const filasEliminadas = await Vistas.destroy({
            where: { id_vista: vistaId },
            transaction
        });

        if (filasEliminadas === 0) {
            // Esto no debería pasar debido a la verificación previa
            await transaction.rollback();
            const error = new Error('No se pudo eliminar la vista (posible condición de carrera)');
            error.statusCode = 500;
            return next(error);
        }

        // Confirmar transacción
        await transaction.commit();

        // Registrar eliminación (para auditoría)
        console.log(`Vista eliminada - ID: ${vistaInfo.id_vista}, Nombre: ${vistaInfo.vista}, Usuario: ${req.user?.id || 'Sistema'}`);

        return res.status(200).json({
            success: true,
            message: 'Vista eliminada correctamente',
            data: {
                vistaEliminada: vistaInfo,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        // Rollback en caso de error
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error al hacer rollback:', rollbackError);
            }
        }
        
        console.error('Error en vistaDelete:', error.message || error);
        
        // Manejar errores específicos de Sequelize
        if (error.name === 'SequelizeDatabaseError') {
            // Verificar si es error de FK constraint
            if (error.message.includes('foreign key constraint') || error.message.includes('FOREIGN KEY')) {
                error.message = 'No se puede eliminar la vista porque tiene registros asociados en otras tablas';
                error.statusCode = 409;
            } else {
                error.message = 'Error en la base de datos';
                error.statusCode = 500;
            }
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            error.message = 'No se puede eliminar la vista porque tiene registros asociados en otras tablas';
            error.statusCode = 409;
            // Opcional: Obtener información de la constraint
            // error.data = { 
            //     table: error.parent.table,
            //     constraint: error.parent.constraint 
            // };
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            error.message = 'Error de restricción única';
            error.statusCode = 409;
        } else if (error.name === 'SequelizeValidationError') {
            error.message = 'Error de validación';
            error.statusCode = 400;
        } else if (error.name === 'SequelizeTimeoutError') {
            error.message = 'Tiempo de espera agotado en la operación';
            error.statusCode = 504;
        }
        
        // Usar el middleware de errores
        return next(error);
    }
};

