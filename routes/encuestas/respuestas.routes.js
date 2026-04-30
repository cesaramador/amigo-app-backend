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
import {
    respuestasGetValidation,
    idRespuestaParamValidation,
    respuestaPostValidation,
    respuestaPutValidation,
    respuestaPatchValidation
} from '../../middleware/encuestas/respuestas.validator.js';

const respuestasRouter = Router();

// path : /api/v1/respuestas (GET)
// leer todas las respuestas
respuestasRouter.get('/', autorizaAcceso, respuestasGetValidation, respuestasGet);

// path : /api/v1/respuestas/:id (GET)
// leer una respuesta por id
respuestasRouter.get('/:id', autorizaAcceso, idRespuestaParamValidation, respuestaGetById);

// path : /api/v1/respuestas (POST)
// crear una nueva respuesta
respuestasRouter.post('/', autorizaAcceso, respuestaPostValidation, respuestaPost);

// path : /api/v1/respuestas/:id (PUT)
// actualizar una respuesta por id
respuestasRouter.put('/:id', autorizaAcceso, idRespuestaParamValidation, respuestaPutValidation, respuestaPut);

// path : /api/v1/respuestas/:id (PATCH)
// actualizar parcialmente una respuesta por id
respuestasRouter.patch('/:id', autorizaAcceso, idRespuestaParamValidation, respuestaPatchValidation, respuestaPatch);

// path : /api/v1/respuestas/:id (DELETE)
// eliminar una respuesta por id
respuestasRouter.delete('/:id', autorizaAcceso, idRespuestaParamValidation, respuestaDelete);

export default respuestasRouter;
