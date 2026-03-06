import { Router } from 'express';
import {
    respuestasGet,
    respuestaGetById,
    respuestaPost,
    respuestaPut,
    respuestaPatch,
    respuestaDelete
} from '../../controllers/encuestas/respuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const respuestasRouter = Router();

// path : /api/v1/respuestas (GET)
// leer todas las respuestas
respuestasRouter.get('/', autorizaAcceso, respuestasGet);

// path : /api/v1/respuestas/:id (GET)
// leer una respuesta por id
respuestasRouter.get('/:id', autorizaAcceso, respuestaGetById);

// path : /api/v1/respuestas (POST)
// crear una nueva respuesta
respuestasRouter.post('/', autorizaAcceso, respuestaPost);

// path : /api/v1/respuestas/:id (PUT)
// actualizar una respuesta por id
respuestasRouter.put('/:id', autorizaAcceso, respuestaPut);

// path : /api/v1/respuestas/:id (PATCH)
// actualizar parcialmente una respuesta por id
respuestasRouter.patch('/:id', autorizaAcceso, respuestaPatch);

// path : /api/v1/respuestas/:id (DELETE)
// eliminar una respuesta por id
respuestasRouter.delete('/:id', autorizaAcceso, respuestaDelete);

export default respuestasRouter;
