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
import {
    publicacionesGetValidation,
    idPublicacionParamValidation,
    publicacionPostValidation,
    publicacionPutValidation,
    publicacionPatchValidation
} from '../../middleware/proveedores/publicaciones.validator.js';

const publicacionesRouter = Router();

// path : /api/v1/publicaciones (GET)
// leer todas las publicaciones
publicacionesRouter.get('/', autorizaAcceso, publicacionesGetValidation, publicacionesGet);

// path : /api/v1/publicaciones/:id (GET)
// leer una publicacion por id
publicacionesRouter.get('/:id', autorizaAcceso, idPublicacionParamValidation, publicacionGetById);

// path : /api/v1/publicaciones (POST)
// crear una nueva publicacion
publicacionesRouter.post('/', autorizaAcceso, publicacionPostValidation, publicacionPost);

// path : /api/v1/publicaciones/:id (PUT)
// actualizar una publicacion por id
publicacionesRouter.put('/:id', autorizaAcceso, idPublicacionParamValidation, publicacionPutValidation, publicacionPut);

// path : /api/v1/publicaciones/:id (PATCH)
// actualizar parcialmente una publicacion por id
publicacionesRouter.patch('/:id', autorizaAcceso, idPublicacionParamValidation, publicacionPatchValidation, publicacionPatch);

// path : /api/v1/publicaciones/:id (DELETE)
// eliminar una publicacion por id
publicacionesRouter.delete('/:id', autorizaAcceso, idPublicacionParamValidation, publicacionDelete);

export default publicacionesRouter;
