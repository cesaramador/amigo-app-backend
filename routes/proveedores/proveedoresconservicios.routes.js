import { Router } from 'express';
import {
    proveedoresconserviciosGet,
    proveedoresconservicioGetById,
    proveedoresconservicioPost,
    proveedoresconservicioPut,
    proveedoresconservicioPatch,
    proveedoresconservicioDelete
} from '../../controllers/proveedores/proveedoresconservicios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    proveedoresConServiciosGetValidation,
    idProveedorConServicioParamValidation,
    proveedorConServicioBodyRequiredValidation,
    proveedorConServicioBodyPatchValidation
} from '../../middleware/proveedores/proveedoresconservicios.validator.js';

const proveedoresconserviciosRouter = Router();

// path : /api/v1/proveedoresconservicios (GET)
// leer todos los proveedores con servicios
proveedoresconserviciosRouter.get('/', autorizaAcceso, proveedoresConServiciosGetValidation, proveedoresconserviciosGet);

// path : /api/v1/proveedoresconservicios/:id (GET)
// leer un proveedor con servicio por id
proveedoresconserviciosRouter.get('/:id', autorizaAcceso, idProveedorConServicioParamValidation, proveedoresconservicioGetById);

// path : /api/v1/proveedoresconservicios (POST)
// crear un nuevo proveedor con servicio
proveedoresconserviciosRouter.post('/', autorizaAcceso, proveedorConServicioBodyRequiredValidation, proveedoresconservicioPost);

// path : /api/v1/proveedoresconservicios/:id (PUT)
// actualizar un proveedor con servicio por id
proveedoresconserviciosRouter.put('/:id', autorizaAcceso, idProveedorConServicioParamValidation, proveedorConServicioBodyRequiredValidation, proveedoresconservicioPut);

// path : /api/v1/proveedoresconservicios/:id (PATCH)
// actualizar parcialmente un proveedor con servicio por id
proveedoresconserviciosRouter.patch('/:id', autorizaAcceso, idProveedorConServicioParamValidation, proveedorConServicioBodyPatchValidation, proveedoresconservicioPatch);

// path : /api/v1/proveedoresconservicios/:id (DELETE)
// eliminar un proveedor con servicio por id
proveedoresconserviciosRouter.delete('/:id', autorizaAcceso, idProveedorConServicioParamValidation, proveedoresconservicioDelete);

export default proveedoresconserviciosRouter;
