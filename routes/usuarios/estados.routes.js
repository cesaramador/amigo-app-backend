import { Router } from 'express';
import { estadosGet, 
    estadoGetById, 
    estadoPost, 
    estadoPut, 
    estadoPatch, 
    estadoDelete } 
    from '../../controllers/usuarios/estados.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const estadoRouter = Router();

// path : /api/v1/estados (GET)
// leer todos los estados
estadoRouter.get('/', autorizaAcceso, estadosGet);

// path : /api/v1/estados (GET)
// leer un estado por id
estadoRouter.get('/:id', autorizaAcceso, estadoGetById);

// path : /api/v1/estados (POST)
// crear un nuevo estado
estadoRouter.post('/', autorizaAcceso, estadoPost);

// path : /api/v1/estados (PUT)
// actualizar un estado por id
estadoRouter.put('/:id', autorizaAcceso, estadoPut);

// path : /api/v1/estados (PATCH)
// actualizar un estado por id
estadoRouter.patch('/:id', autorizaAcceso, estadoPatch);

// path : /api/v1/estados (DELETE)
// eliminar un estado por id
estadoRouter.delete('/:id', autorizaAcceso, estadoDelete);

export default estadoRouter;