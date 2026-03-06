import { Router } from 'express';
import {
    serviciosproveedoresGet,
    serviciosproveedoresGetById,
    serviciosproveedoresPost,
    serviciosproveedoresPut,
    serviciosproveedoresPatch,
    serviciosproveedoresDelete
} from '../../controllers/proveedores/serviciosproveedores.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const serviciosproveedoresRouter = Router();

// path : /api/v1/serviciosproveedores (GET)
// leer todas las publicaciones
serviciosproveedoresRouter.get('/', autorizaAcceso, serviciosproveedoresGet);

// path : /api/v1/serviciosproveedores/:id (GET)
// leer una publicacion por id
serviciosproveedoresRouter.get('/:id', autorizaAcceso, serviciosproveedoresGetById);

// path : /api/v1/serviciosproveedores (POST)
// crear una nueva publicacion
serviciosproveedoresRouter.post('/', autorizaAcceso, serviciosproveedoresPost);

// path : /api/v1/serviciosproveedores/:id (PUT)
// actualizar una publicacion por id
serviciosproveedoresRouter.put('/:id', autorizaAcceso, serviciosproveedoresPut);

// path : /api/v1/serviciosproveedores/:id (PATCH)
// actualizar parcialmente una publicacion por id
serviciosproveedoresRouter.patch('/:id', autorizaAcceso, serviciosproveedoresPatch);

// path : /api/v1/serviciosproveedores/:id (DELETE)
// eliminar una publicacion por id
serviciosproveedoresRouter.delete('/:id', autorizaAcceso, serviciosproveedoresDelete);

export default serviciosproveedoresRouter;
