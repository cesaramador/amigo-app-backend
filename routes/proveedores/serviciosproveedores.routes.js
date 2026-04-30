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
import {
    serviciosProveedoresGetValidation,
    idServicioProveedorParamValidation,
    servicioProveedorBodyRequiredValidation,
    servicioProveedorBodyPatchValidation
} from '../../middleware/proveedores/serviciosproveedores.validator.js';

const serviciosproveedoresRouter = Router();

// path : /api/v1/serviciosproveedores (GET)
// leer todas las publicaciones
serviciosproveedoresRouter.get('/', autorizaAcceso, serviciosProveedoresGetValidation, serviciosProveedoresGet);

// path : /api/v1/serviciosproveedores/:id (GET)
// leer una publicacion por id
serviciosproveedoresRouter.get('/:id', autorizaAcceso, idServicioProveedorParamValidation, serviciosProveedorGetById);

// path : /api/v1/serviciosproveedores (POST)
// crear una nueva publicacion
serviciosproveedoresRouter.post('/', autorizaAcceso, servicioProveedorBodyRequiredValidation, serviciosProveedorPost);

// path : /api/v1/serviciosproveedores/:id (PUT)
// actualizar una publicacion por id
serviciosproveedoresRouter.put('/:id', autorizaAcceso, idServicioProveedorParamValidation, servicioProveedorBodyRequiredValidation, serviciosProveedorPut);

// path : /api/v1/serviciosproveedores/:id (PATCH)
// actualizar parcialmente una publicacion por id
serviciosproveedoresRouter.patch('/:id', autorizaAcceso, idServicioProveedorParamValidation, servicioProveedorBodyPatchValidation, serviciosProveedorPatch);

// path : /api/v1/serviciosproveedores/:id (DELETE)
// eliminar una publicacion por id
serviciosproveedoresRouter.delete('/:id', autorizaAcceso, idServicioProveedorParamValidation, serviciosProveedorDelete);

export default serviciosproveedoresRouter;
