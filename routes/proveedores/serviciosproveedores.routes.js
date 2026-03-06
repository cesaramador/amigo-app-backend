import { Router } from 'express';
import {
    serviciosProveedoresGet,
    serviciosProveedorGetById,
    serviciosProveedorPost,
    serviciosProveedorPut,
    serviciosProveedorPatch,
    serviciosProveedorDelete
} from '../../controllers/proveedores/serviciosproveedores.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const serviciosproveedoresRouter = Router();

// path : /api/v1/serviciosproveedores (GET)
// leer todas las publicaciones
serviciosproveedoresRouter.get('/', autorizaAcceso, serviciosProveedoresGet);

// path : /api/v1/serviciosproveedores/:id (GET)
// leer una publicacion por id
serviciosproveedoresRouter.get('/:id', autorizaAcceso, serviciosProveedorGetById);

// path : /api/v1/serviciosproveedores (POST)
// crear una nueva publicacion
serviciosproveedoresRouter.post('/', autorizaAcceso, serviciosProveedorPost);

// path : /api/v1/serviciosproveedores/:id (PUT)
// actualizar una publicacion por id
serviciosproveedoresRouter.put('/:id', autorizaAcceso, serviciosProveedorPut);

// path : /api/v1/serviciosproveedores/:id (PATCH)
// actualizar parcialmente una publicacion por id
serviciosproveedoresRouter.patch('/:id', autorizaAcceso, serviciosProveedorPatch);

// path : /api/v1/serviciosproveedores/:id (DELETE)
// eliminar una publicacion por id
serviciosproveedoresRouter.delete('/:id', autorizaAcceso, serviciosProveedorDelete);

export default serviciosproveedoresRouter;
