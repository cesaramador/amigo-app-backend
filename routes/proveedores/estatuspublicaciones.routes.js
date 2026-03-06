import { Router } from 'express';
import {
    estatuspublicacionesGet,
    estatuspublicacionGetById,
    estatuspublicacionPost,
    estatuspublicacionPut,
    estatuspublicacionPatch,
    estatuspublicacionDelete
} from '../../controllers/proveedores/estatuspublicaciones.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const estatuspublicacionesRouter = Router();

// path : /api/v1/estatuspublicaciones (GET)
// leer todos los estatus de publicaciones
estatuspublicacionesRouter.get('/', autorizaAcceso, estatuspublicacionesGet);

// path : /api/v1/estatuspublicaciones/:id (GET)
// leer un estatus de publicacion por id
estatuspublicacionesRouter.get('/:id', autorizaAcceso, estatuspublicacionGetById);

// path : /api/v1/estatuspublicaciones (POST)
// crear un nuevo estatus de publicacion
estatuspublicacionesRouter.post('/', autorizaAcceso, estatuspublicacionPost);

// path : /api/v1/estatuspublicaciones/:id (PUT)
// actualizar un estatus de publicacion por id
estatuspublicacionesRouter.put('/:id', autorizaAcceso, estatuspublicacionPut);

// path : /api/v1/estatuspublicaciones/:id (PATCH)
// actualizar parcialmente un estatus de publicacion por id
estatuspublicacionesRouter.patch('/:id', autorizaAcceso, estatuspublicacionPatch);

// path : /api/v1/estatuspublicaciones/:id (DELETE)
// eliminar un estatus de publicacion por id
estatuspublicacionesRouter.delete('/:id', autorizaAcceso, estatuspublicacionDelete);

export default estatuspublicacionesRouter;