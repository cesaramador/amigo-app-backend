import { Router } from 'express';
import { estatusmaritalesGet, 
    estatusmaritalGetById, 
    estatusmaritalPost, 
    estatusmaritalPut, 
    estatusmaritalPatch, 
    estatusmaritalDelete } 
    from '../../controllers/usuarios/estatusmaritales.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const estatusmaritalRouter = Router();

// path : /api/v1/estatusmaritales (GET)
// leer todos los estatus maritales
estatusmaritalRouter.get('/', autorizaAcceso, estatusmaritalesGet);

// path : /api/v1/estatusmaritales (GET)
// leer un estatus marital por id
estatusmaritalRouter.get('/:id', autorizaAcceso, estatusmaritalGetById);

// path : /api/v1/estatusmaritales (POST)
// crear un nuevo estatus marital
estatusmaritalRouter.post('/', autorizaAcceso, estatusmaritalPost);

// path : /api/v1/estatusmaritales (PUT)
// actualizar un estatus marital por id
estatusmaritalRouter.put('/:id', autorizaAcceso, estatusmaritalPut);

// path : /api/v1/estatusmaritales (PATCH)
// actualizar un estatus marital por id
estatusmaritalRouter.patch('/:id', autorizaAcceso, estatusmaritalPatch);

// path : /api/v1/estatusmaritales (DELETE)
// eliminar un estatus marital por id
estatusmaritalRouter.delete('/:id', autorizaAcceso, estatusmaritalDelete);

export default estatusmaritalRouter;