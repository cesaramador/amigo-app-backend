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
import {
    tipoEncuestasGetValidation,
    idTipoEncuestaParamValidation,
    tipoEncuestaPostValidation,
    tipoEncuestaPutValidation,
    tipoEncuestaPatchValidation
} from '../../middleware/encuestas/tipoencuestas.validator.js';

const tipoencuestasRouter = Router();

// path : /api/v1/tipoencuestas (GET)
// leer todas los tipos de encuestas
tipoencuestasRouter.get('/', autorizaAcceso, tipoEncuestasGetValidation, tipoencuestasGet);

// path : /api/v1/tipoencuestas/:id (GET)
// leer un tipo de encuesta por id
tipoencuestasRouter.get('/:id', autorizaAcceso, idTipoEncuestaParamValidation, tipoencuestaGetById);

// path : /api/v1/tipoencuestas (POST)
// crear un nuevo tipo de encuesta
tipoencuestasRouter.post('/', autorizaAcceso, tipoEncuestaPostValidation, tipoencuestaPost);

// path : /api/v1/tipoencuestas/:id (PUT)
// actualizar un tipo de encuesta por id
tipoencuestasRouter.put('/:id', autorizaAcceso, idTipoEncuestaParamValidation, tipoEncuestaPutValidation, tipoencuestaPut);

// path : /api/v1/tipoencuestas/:id (PATCH)
// actualizar parcialmente un tipo de encuesta por id
tipoencuestasRouter.patch('/:id', autorizaAcceso, idTipoEncuestaParamValidation, tipoEncuestaPatchValidation, tipoencuestaPatch);

// path : /api/v1/tipoencuestas/:id (DELETE)
// eliminar un tipo de encuesta por id
tipoencuestasRouter.delete('/:id', autorizaAcceso, idTipoEncuestaParamValidation, tipoencuestaDelete);

export default tipoencuestasRouter;
