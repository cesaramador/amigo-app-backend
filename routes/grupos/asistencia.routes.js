import { Router } from 'express';
import {
    asistenciasGet,
    asistenciaGetById,
    asistenciaPost,
    asistenciaPut,
    asistenciaPatch,
    asistenciaDelete
} from '../../controllers/grupos/asistencias.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const asistenciaRouter = Router();

// path : /api/v1/asistencia (GET)
// leer todas las asistencias
asistenciaRouter.get('/', autorizaAcceso, asistenciasGet);

// path : /api/v1/asistencia/:id (GET)
// leer una asistencia por id
asistenciaRouter.get('/:id', autorizaAcceso, asistenciaGetById);

// path : /api/v1/asistencia (POST)
// crear una nueva asistencia
asistenciaRouter.post('/', autorizaAcceso, asistenciaPost);

// path : /api/v1/asistencia/:id (PUT)
// actualizar una asistencia por id
asistenciaRouter.put('/:id', autorizaAcceso, asistenciaPut);

// path : /api/v1/asistencia/:id (PATCH)
// actualizar parcialmente una asistencia por id
asistenciaRouter.patch('/:id', autorizaAcceso, asistenciaPatch);

// path : /api/v1/asistencia/:id (DELETE)
// eliminar una asistencia por id
asistenciaRouter.delete('/:id', autorizaAcceso, asistenciaDelete);

export default asistenciaRouter;
