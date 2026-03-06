import { Router } from 'express';
import {
    tipoencuestasGet,
    tipoencuestaGetById,
    tipoencuestaPost,
    tipoencuestaPut,
    tipoencuestaPatch,
    tipoencuestaDelete
} from '../../controllers/encuestas/tipoencuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const tipoencuestasRouter = Router();

// path : /api/v1/tipoencuestas (GET)
// leer todas los tipos de encuestas
tipoencuestasRouter.get('/', autorizaAcceso, tipoencuestasGet);

// path : /api/v1/tipoencuestas/:id (GET)
// leer un tipo de encuesta por id
tipoencuestasRouter.get('/:id', autorizaAcceso, tipoencuestaGetById);

// path : /api/v1/tipoencuestas (POST)
// crear un nuevo tipo de encuesta
tipoencuestasRouter.post('/', autorizaAcceso, tipoencuestaPost);

// path : /api/v1/tipoencuestas/:id (PUT)
// actualizar un tipo de encuesta por id
tipoencuestasRouter.put('/:id', autorizaAcceso, tipoencuestaPut);

// path : /api/v1/tipoencuestas/:id (PATCH)
// actualizar parcialmente un tipo de encuesta por id
tipoencuestasRouter.patch('/:id', autorizaAcceso, tipoencuestaPatch);

// path : /api/v1/tipoencuestas/:id (DELETE)
// eliminar un tipo de encuesta por id
tipoencuestasRouter.delete('/:id', autorizaAcceso, tipoencuestaDelete);

export default tipoencuestasRouter;
