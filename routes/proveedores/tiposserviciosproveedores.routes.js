import { Router } from 'express';
import {
    tiposServiciosProveedoresGet,
    tiposServiciosProveedorGetById,
    tiposServiciosProveedorPost,
    tiposServiciosProveedorPut,
    tiposServiciosProveedorPatch,
    tiposServiciosProveedorDelete
} from '../../controllers/proveedores/tiposserviciosproveedores.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    tiposServiciosProveedoresGetValidation,
    idTipoServicioProveedorParamValidation,
    tipoServicioProveedorBodyRequiredValidation,
    tipoServicioProveedorBodyPatchValidation
} from '../../middleware/proveedores/tiposserviciosproveedores.validator.js';

const tiposserviciosproveedoresRouter = Router();

// path : /api/v1/tiposserviciosproveedores (GET)
// leer todas las publicaciones
tiposserviciosproveedoresRouter.get('/', autorizaAcceso, tiposServiciosProveedoresGetValidation, tiposServiciosProveedoresGet);

// path : /api/v1/tiposserviciosproveedores/:id (GET)
// leer una publicacion por id
tiposserviciosproveedoresRouter.get('/:id', autorizaAcceso, idTipoServicioProveedorParamValidation, tiposServiciosProveedorGetById);

// path : /api/v1/tiposserviciosproveedores (POST)
// crear una nueva publicacion
tiposserviciosproveedoresRouter.post('/', autorizaAcceso, tipoServicioProveedorBodyRequiredValidation, tiposServiciosProveedorPost);

// path : /api/v1/tiposserviciosproveedores/:id (PUT)
// actualizar una publicacion por id
tiposserviciosproveedoresRouter.put('/:id', autorizaAcceso, idTipoServicioProveedorParamValidation, tipoServicioProveedorBodyRequiredValidation, tiposServiciosProveedorPut);

// path : /api/v1/tiposserviciosproveedores/:id (PATCH)
// actualizar parcialmente una publicacion por id
tiposserviciosproveedoresRouter.patch('/:id', autorizaAcceso, idTipoServicioProveedorParamValidation, tipoServicioProveedorBodyPatchValidation, tiposServiciosProveedorPatch);

// path : /api/v1/tiposserviciosproveedores/:id (DELETE)
// eliminar una publicacion por id
tiposserviciosproveedoresRouter.delete('/:id', autorizaAcceso, idTipoServicioProveedorParamValidation, tiposServiciosProveedorDelete);

export default tiposserviciosproveedoresRouter;
