import { Router } from 'express';
import {
    detalleusuariosencuestasGet,
    detalleusuarioencuestaGetById,
    detalleusuarioencuestaPost,
    detalleusuarioencuestaPut,
    detalleusuarioencuestaPatch,
    detalleusuarioencuestaDelete
} from '../../controllers/encuestas/detalleusuariosencuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const detalleusuariosencuestasRouter = Router();

// path : /api/v1/detalleusuariosencuestas (GET)
// leer todas las publicaciones
detalleusuariosencuestasRouter.get('/', autorizaAcceso, detalleusuariosencuestasGet);

// path : /api/v1/detalleusuariosencuestas/:id (GET)
// leer una publicacion por id
detalleusuariosencuestasRouter.get('/:id', autorizaAcceso, detalleusuarioencuestaGetById);

// path : /api/v1/detalleusuariosencuestas (POST)
// crear una nueva publicacion
detalleusuariosencuestasRouter.post('/', autorizaAcceso, detalleusuarioencuestaPost);

// path : /api/v1/detalleusuariosencuestas/:id (PUT)
// actualizar una publicacion por id
detalleusuariosencuestasRouter.put('/:id', autorizaAcceso, detalleusuarioencuestaPut);

// path : /api/v1/detalleusuariosencuestas/:id (PATCH)
// actualizar parcialmente una publicacion por id
detalleusuariosencuestasRouter.patch('/:id', autorizaAcceso, detalleusuarioencuestaPatch);

// path : /api/v1/detalleusuariosencuestas/:id (DELETE)
// eliminar una publicacion por id
detalleusuariosencuestasRouter.delete('/:id', autorizaAcceso, detalleusuarioencuestaDelete);

export default detalleusuariosencuestasRouter;
