import { Router } from 'express';
import {
    usuariosencuestasGet,
    usuariosencuestaGetById,
    usuariosencuestaPost,
    usuariosencuestaPut,
    usuariosencuestaPatch,
    usuariosencuestaDelete
} from '../../controllers/encuestas/usuariosencuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    usuariosEncuestasGetValidation,
    idUsuarioEncuestaParamValidation,
    usuariosEncuestaPostValidation,
    usuariosEncuestaPutValidation,
    usuariosEncuestaPatchValidation
} from '../../middleware/encuestas/usuariosencuestas.validator.js';

const usuariosencuestasRouter = Router();

// path : /api/v1/usuariosencuestas (GET)
// leer todas las usuariosencuestas
usuariosencuestasRouter.get('/', autorizaAcceso, usuariosEncuestasGetValidation, usuariosencuestasGet);

// path : /api/v1/usuariosencuestas/:id (GET)
// leer una usuariosencuesta por id
usuariosencuestasRouter.get('/:id', autorizaAcceso, idUsuarioEncuestaParamValidation, usuariosencuestaGetById);

// path : /api/v1/usuariosencuestas (POST)
// crear una nueva usuariosencuesta
usuariosencuestasRouter.post('/', autorizaAcceso, usuariosEncuestaPostValidation, usuariosencuestaPost);

// path : /api/v1/usuariosencuestas/:id (PUT)
// actualizar una usuariosencuesta por id
usuariosencuestasRouter.put('/:id', autorizaAcceso, idUsuarioEncuestaParamValidation, usuariosEncuestaPutValidation, usuariosencuestaPut);

// path : /api/v1/usuariosencuestas/:id (PATCH)
// actualizar parcialmente una usuariosencuesta por id
usuariosencuestasRouter.patch('/:id', autorizaAcceso, idUsuarioEncuestaParamValidation, usuariosEncuestaPatchValidation, usuariosencuestaPatch);

// path : /api/v1/usuariosencuestas/:id (DELETE)
// eliminar una usuariosencuesta por id
usuariosencuestasRouter.delete('/:id', autorizaAcceso, idUsuarioEncuestaParamValidation, usuariosencuestaDelete);

export default usuariosencuestasRouter;
