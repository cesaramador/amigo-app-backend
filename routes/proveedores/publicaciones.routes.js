import { Router } from 'express';
import {
    publicacionesGet,
    publicacionesGetById,
    publicacionesPost,
    publicacionesPut,
    publicacionesPatch,
    publicacionesDelete
} from '../../controllers/proveedores/publicaciones.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const publicacionesRouter = Router();

// path : /api/v1/publicaciones (GET)
// leer todas las publicaciones
publicacionesRouter.get('/', autorizaAcceso, publicacionesGet);

// path : /api/v1/publicaciones/:id (GET)
// leer una publicacion por id
publicacionesRouter.get('/:id', autorizaAcceso, publicacionesGetById);

// path : /api/v1/publicaciones (POST)
// crear una nueva publicacion
publicacionesRouter.post('/', autorizaAcceso, publicacionesPost);

// path : /api/v1/publicaciones/:id (PUT)
// actualizar una publicacion por id
publicacionesRouter.put('/:id', autorizaAcceso, publicacionesPut);

// path : /api/v1/publicaciones/:id (PATCH)
// actualizar parcialmente una publicacion por id
publicacionesRouter.patch('/:id', autorizaAcceso, publicacionesPatch);

// path : /api/v1/publicaciones/:id (DELETE)
// eliminar una publicacion por id
publicacionesRouter.delete('/:id', autorizaAcceso, publicacionesDelete);

export default publicacionesRouter;
