import { Router } from 'express';
import {
    detalleusuariosencuestasGet,
    detalleusuariosencuestaGetById,
    detalleusuariosencuestaPost,
    detalleusuariosencuestaPut,
    detalleusuariosencuestaPatch,
    detalleusuariosencuestaDelete
} from '../../controllers/encuestas/detalleusuariosencuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const detalleusuariosencuestasRouter = Router();

// path : /api/v1/detalleusuariosencuestas (GET)
// leer todas las publicaciones
detalleusuariosencuestasRouter.get('/', autorizaAcceso, detalleusuariosencuestasGet);

// path : /api/v1/detalleusuariosencuestas/:id (GET)
// leer una publicacion por id
detalleusuariosencuestasRouter.get('/:id', autorizaAcceso, detalleusuariosencuestaGetById);

// path : /api/v1/detalleusuariosencuestas (POST)
// crear una nueva publicacion
detalleusuariosencuestasRouter.post('/', autorizaAcceso, detalleusuariosencuestaPost);

// path : /api/v1/detalleusuariosencuestas/:id (PUT)
// actualizar una publicacion por id
detalleusuariosencuestasRouter.put('/:id', autorizaAcceso, detalleusuariosencuestaPut);

// path : /api/v1/detalleusuariosencuestas/:id (PATCH)
// actualizar parcialmente una publicacion por id
detalleusuariosencuestasRouter.patch('/:id', autorizaAcceso, detalleusuariosencuestaPatch);

// path : /api/v1/detalleusuariosencuestas/:id (DELETE)
// eliminar una publicacion por id
detalleusuariosencuestasRouter.delete('/:id', autorizaAcceso, detalleusuariosencuestaDelete);

export default detalleusuariosencuestasRouter;
