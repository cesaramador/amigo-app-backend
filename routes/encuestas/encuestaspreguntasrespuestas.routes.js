import { Router } from 'express';
import {
    encuestaspreguntasrespuestasGet,
    encuestapreguntarespuestaGetById,
    encuestapreguntarespuestaPost,
    encuestapreguntarespuestaPut,
    encuestapreguntarespuestaPatch,
    encuestapreguntarespuestaDelete
} from '../../controllers/encuestas/encuestaspreguntasrespuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const encuestaspreguntasrespuestasRouter = Router();

// path : /api/v1/encuestaspreguntasrespuestas (GET)
// leer todas las encuestaspreguntasrespuestas
encuestaspreguntasrespuestasRouter.get('/', autorizaAcceso, encuestaspreguntasrespuestasGet);

// path : /api/v1/encuestaspreguntasrespuestas/:id (GET)
// leer una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.get('/:id', autorizaAcceso, encuestapreguntarespuestaGetById);

// path : /api/v1/encuestaspreguntasrespuestas (POST)
// crear una nueva encuestaspreguntasrespuesta
encuestaspreguntasrespuestasRouter.post('/', autorizaAcceso, encuestapreguntarespuestaPost);

// path : /api/v1/encuestaspreguntasrespuestas/:id (PUT)
// actualizar una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.put('/:id', autorizaAcceso, encuestapreguntarespuestaPut);

// path : /api/v1/encuestaspreguntasrespuestas/:id (PATCH)
// actualizar parcialmente una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.patch('/:id', autorizaAcceso, encuestapreguntarespuestaPatch);

// path : /api/v1/encuestaspreguntasrespuestas/:id (DELETE)
// eliminar una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.delete('/:id', autorizaAcceso, encuestapreguntarespuestaDelete);

export default encuestaspreguntasrespuestasRouter;
