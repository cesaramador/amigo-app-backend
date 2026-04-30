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
import {
    encuestasPreguntasRespuestasGetValidation,
    idEncuestaPreguntaRespuestaParamValidation,
    encuestaPreguntaRespuestaPostValidation,
    encuestaPreguntaRespuestaPutValidation,
    encuestaPreguntaRespuestaPatchValidation
} from '../../middleware/encuestas/encuestaspreguntasrespuestas.validator.js';

const encuestaspreguntasrespuestasRouter = Router();

// path : /api/v1/encuestaspreguntasrespuestas (GET)
// leer todas las encuestaspreguntasrespuestas
encuestaspreguntasrespuestasRouter.get('/', autorizaAcceso, encuestasPreguntasRespuestasGetValidation, encuestaspreguntasrespuestasGet);

// path : /api/v1/encuestaspreguntasrespuestas/:id (GET)
// leer una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.get('/:id', autorizaAcceso, idEncuestaPreguntaRespuestaParamValidation, encuestapreguntarespuestaGetById);

// path : /api/v1/encuestaspreguntasrespuestas (POST)
// crear una nueva encuestaspreguntasrespuesta
encuestaspreguntasrespuestasRouter.post('/', autorizaAcceso, encuestaPreguntaRespuestaPostValidation, encuestapreguntarespuestaPost);

// path : /api/v1/encuestaspreguntasrespuestas/:id (PUT)
// actualizar una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.put('/:id', autorizaAcceso, idEncuestaPreguntaRespuestaParamValidation, encuestaPreguntaRespuestaPutValidation, encuestapreguntarespuestaPut);

// path : /api/v1/encuestaspreguntasrespuestas/:id (PATCH)
// actualizar parcialmente una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.patch('/:id', autorizaAcceso, idEncuestaPreguntaRespuestaParamValidation, encuestaPreguntaRespuestaPatchValidation, encuestapreguntarespuestaPatch);

// path : /api/v1/encuestaspreguntasrespuestas/:id (DELETE)
// eliminar una encuestaspreguntasrespuesta por id
encuestaspreguntasrespuestasRouter.delete('/:id', autorizaAcceso, idEncuestaPreguntaRespuestaParamValidation, encuestapreguntarespuestaDelete);

export default encuestaspreguntasrespuestasRouter;
