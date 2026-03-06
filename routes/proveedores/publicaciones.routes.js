import { Router } from 'express';
import {
    publicacionesGet,
    publicacionGetById,
    publicacionPost,
    publicacionPut,
    publicacionPatch,
    publicacionDelete
} from '../../controllers/proveedores/publicaciones.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const publicacionesRouter = Router();

// path : /api/v1/publicaciones (GET)
// leer todas las publicaciones
publicacionesRouter.get('/', autorizaAcceso, publicacionesGet);

// path : /api/v1/publicaciones/:id (GET)
// leer una publicacion por id
publicacionesRouter.get('/:id', autorizaAcceso, publicacionGetById);

// path : /api/v1/publicaciones (POST)
// crear una nueva publicacion
publicacionesRouter.post('/', autorizaAcceso, publicacionPost);

// path : /api/v1/publicaciones/:id (PUT)
// actualizar una publicacion por id
publicacionesRouter.put('/:id', autorizaAcceso, publicacionPut);

// path : /api/v1/publicaciones/:id (PATCH)
// actualizar parcialmente una publicacion por id
publicacionesRouter.patch('/:id', autorizaAcceso, publicacionPatch);

// path : /api/v1/publicaciones/:id (DELETE)
// eliminar una publicacion por id
publicacionesRouter.delete('/:id', autorizaAcceso, publicacionDelete);

export default publicacionesRouter;
