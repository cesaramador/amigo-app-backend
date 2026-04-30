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
import {
    encuestasGetValidation,
    idEncuestaParamValidation,
    encuestaPostValidation,
    encuestaPutValidation,
    encuestaPatchValidation
} from '../../middleware/encuestas/encuestas.validator.js';

const encuestasRouter = Router();

// path : /api/v1/encuestas (GET)
// leer todas las encuestas
encuestasRouter.get('/', autorizaAcceso, encuestasGetValidation, encuestasGet);

// path : /api/v1/encuestas/:id (GET)
// leer una encuesta por id
encuestasRouter.get('/:id', autorizaAcceso, idEncuestaParamValidation, encuestaGetById);

// path : /api/v1/encuestas (POST)
// crear una nueva encuesta
encuestasRouter.post('/', autorizaAcceso, encuestaPostValidation, encuestaPost);

// path : /api/v1/encuestas/:id (PUT)
// actualizar una encuesta por id
encuestasRouter.put('/:id', autorizaAcceso, idEncuestaParamValidation, encuestaPutValidation, encuestaPut);

// path : /api/v1/encuestas/:id (PATCH)
// actualizar parcialmente una encuesta por id
encuestasRouter.patch('/:id', autorizaAcceso, idEncuestaParamValidation, encuestaPatchValidation, encuestaPatch);

// path : /api/v1/encuestas/:id (DELETE)
// eliminar una encuesta por id
encuestasRouter.delete('/:id', autorizaAcceso, idEncuestaParamValidation, encuestaDelete);

export default encuestasRouter;
