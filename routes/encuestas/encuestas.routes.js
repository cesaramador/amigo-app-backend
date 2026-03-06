import { Router } from 'express';
import {
    encuestasGet,
    encuestaGetById,
    encuestaPost,
    encuestaPut,
    encuestaPatch,
    encuestaDelete
} from '../../controllers/encuestas/encuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const encuestasRouter = Router();

// path : /api/v1/encuestas (GET)
// leer todas las encuestas
encuestasRouter.get('/', autorizaAcceso, encuestasGet);

// path : /api/v1/encuestas/:id (GET)
// leer una encuesta por id
encuestasRouter.get('/:id', autorizaAcceso, encuestaGetById);

// path : /api/v1/encuestas (POST)
// crear una nueva encuesta
encuestasRouter.post('/', autorizaAcceso, encuestaPost);

// path : /api/v1/encuestas/:id (PUT)
// actualizar una encuesta por id
encuestasRouter.put('/:id', autorizaAcceso, encuestaPut);

// path : /api/v1/encuestas/:id (PATCH)
// actualizar parcialmente una encuesta por id
encuestasRouter.patch('/:id', autorizaAcceso, encuestaPatch);

// path : /api/v1/encuestas/:id (DELETE)
// eliminar una encuesta por id
encuestasRouter.delete('/:id', autorizaAcceso, encuestaDelete);

export default encuestasRouter;
