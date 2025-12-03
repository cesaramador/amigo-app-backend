import { Router } from 'express';
import { matrizaccesosGet, 
    matrizaccesoGetById, 
    matrizaccesoPost, 
    matrizaccesoPut, 
    matrizaccesoPatch, 
    matrizaccesoDelete } 
    from '../../controllers/matriz/matrizacceso.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const matrizaccesoRouter = Router();

// path : /api/v1/matrziaccesos (GET)
// leer todos la matriz de accesos
matrizaccesoRouter.get('/', autorizaAcceso, matrizaccesosGet);

// path : /api/v1/matrizaccesos (GET)
// leer la matriz de acceso por id
matrizaccesoRouter.get('/:id', autorizaAcceso, matrizaccesoGetById);

// path : /api/v1/matrizaccesos (POST)
// crear una nueva entrada a la matriz de acceso
matrizaccesoRouter.post('/', autorizaAcceso, matrizaccesoPost);

// path : /api/v1/matrizaccesos (PUT)
// actualizar una entra de la matriz de acceso por id
matrizaccesoRouter.put('/:id', autorizaAcceso, matrizaccesoPut);

// path : /api/v1/matrizaccesos (PATCH)
// actualizar una entrdada de la matriz de acceso por id
matrizaccesoRouter.patch('/:id', autorizaAcceso, matrizaccesoPatch);

// path : /api/v1/matrizaccesos (DELETE)
// eliminar una entrdada de la matriz de acceso por id
matrizaccesoRouter.delete('/:id', autorizaAcceso, matrizaccesoDelete);

export default matrizaccesoRouter;