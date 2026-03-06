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

const usuariosencuestasRouter = Router();

// path : /api/v1/usuariosencuestas (GET)
// leer todas las usuariosencuestas
usuariosencuestasRouter.get('/', autorizaAcceso, usuariosencuestasGet);

// path : /api/v1/usuariosencuestas/:id (GET)
// leer una usuariosencuesta por id
usuariosencuestasRouter.get('/:id', autorizaAcceso, usuariosencuestaGetById);

// path : /api/v1/usuariosencuestas (POST)
// crear una nueva usuariosencuesta
usuariosencuestasRouter.post('/', autorizaAcceso, usuariosencuestaPost);

// path : /api/v1/usuariosencuestas/:id (PUT)
// actualizar una usuariosencuesta por id
usuariosencuestasRouter.put('/:id', autorizaAcceso, usuariosencuestaPut);

// path : /api/v1/usuariosencuestas/:id (PATCH)
// actualizar parcialmente una usuariosencuesta por id
usuariosencuestasRouter.patch('/:id', autorizaAcceso, usuariosencuestaPatch);

// path : /api/v1/usuariosencuestas/:id (DELETE)
// eliminar una usuariosencuesta por id
usuariosencuestasRouter.delete('/:id', autorizaAcceso, usuariosencuestaDelete);

export default usuariosencuestasRouter;
