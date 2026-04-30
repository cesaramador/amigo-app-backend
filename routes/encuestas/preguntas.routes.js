import { Router } from 'express';
import {
    preguntasGet,
    preguntaGetById,
    preguntaPost,
    preguntaPut,
    preguntaPatch,
    preguntaDelete
} from '../../controllers/encuestas/preguntas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    preguntasGetValidation,
    idPreguntaParamValidation,
    preguntaPostValidation,
    preguntaPutValidation,
    preguntaPatchValidation
} from '../../middleware/encuestas/preguntas.validator.js';

const preguntasRouter = Router();

// path : /api/v1/preguntas (GET)
// leer todas las preguntas
preguntasRouter.get('/', autorizaAcceso, preguntasGetValidation, preguntasGet);

// path : /api/v1/preguntas/:id (GET)
// leer una pregunta por id
preguntasRouter.get('/:id', autorizaAcceso, idPreguntaParamValidation, preguntaGetById);

// path : /api/v1/preguntas (POST)
// crear una nueva pregunta
preguntasRouter.post('/', autorizaAcceso, preguntaPostValidation, preguntaPost);

// path : /api/v1/preguntas/:id (PUT)
// actualizar una pregunta por id
preguntasRouter.put('/:id', autorizaAcceso, idPreguntaParamValidation, preguntaPutValidation, preguntaPut);

// path : /api/v1/preguntas/:id (PATCH)
// actualizar parcialmente una pregunta por id
preguntasRouter.patch('/:id', autorizaAcceso, idPreguntaParamValidation, preguntaPatchValidation, preguntaPatch);

// path : /api/v1/preguntas/:id (DELETE)
// eliminar una pregunta por id
preguntasRouter.delete('/:id', autorizaAcceso, idPreguntaParamValidation, preguntaDelete);

export default preguntasRouter;
