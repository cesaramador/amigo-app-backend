import { Router } from 'express';
import {
    proveedoresconserviciosGet,
    proveedoresconserviciosGetById,
    proveedoresconserviciosPost,
    proveedoresconserviciosPut,
    proveedoresconserviciosPatch,
    proveedoresconserviciosDelete
} from '../../controllers/proveedores/proveedoresconservicios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const proveedoresconserviciosRouter = Router();

// path : /api/v1/proveedoresconservicios (GET)
// leer todos los proveedores con servicios
proveedoresconserviciosRouter.get('/', autorizaAcceso, proveedoresconserviciosGet);

// path : /api/v1/proveedoresconservicios/:id (GET)
// leer un proveedor con servicio por id
proveedoresconserviciosRouter.get('/:id', autorizaAcceso, proveedoresconserviciosGetById);

// path : /api/v1/proveedoresconservicios (POST)
// crear un nuevo proveedor con servicio
proveedoresconserviciosRouter.post('/', autorizaAcceso, proveedoresconserviciosPost);

// path : /api/v1/proveedoresconservicios/:id (PUT)
// actualizar un proveedor con servicio por id
proveedoresconserviciosRouter.put('/:id', autorizaAcceso, proveedoresconserviciosPut);

// path : /api/v1/proveedoresconservicios/:id (PATCH)
// actualizar parcialmente un proveedor con servicio por id
proveedoresconserviciosRouter.patch('/:id', autorizaAcceso, proveedoresconserviciosPatch);

// path : /api/v1/proveedoresconservicios/:id (DELETE)
// eliminar un proveedor con servicio por id
proveedoresconserviciosRouter.delete('/:id', autorizaAcceso, proveedoresconserviciosDelete);

export default proveedoresconserviciosRouter;
