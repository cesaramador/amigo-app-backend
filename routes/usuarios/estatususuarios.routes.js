import { Router } from 'express';
import { estatususuariosGet, 
    estatususuarioGetById, 
    estatususuarioPost, 
    estatususuarioPut, 
    estatususuarioPatch, 
    estatususuarioDelete } 
    from '../../controllers/usuarios/estatususuarios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const estatususuarioRouter = Router();

// path : /api/v1/estatususuarios (GET)
// leer todos los estatus de usuarios
estatususuarioRouter.get('/', autorizaAcceso, estatususuariosGet);

// path : /api/v1/estatususuarios (GET)
// leer un estatus de usuario por id
estatususuarioRouter.get('/:id', autorizaAcceso, estatususuarioGetById);

// path : /api/v1/estatususuarios (POST)
// crear un nuevo estatus de usuario
estatususuarioRouter.post('/', autorizaAcceso, estatususuarioPost);

// path : /api/v1/estatususuarios (PUT)
// actualizar un estatus de usuario por id
estatususuarioRouter.put('/:id', autorizaAcceso, estatususuarioPut);

// path : /api/v1/estatususuarios (PATCH)
// actualizar un estatus de usuario por id
estatususuarioRouter.patch('/:id', autorizaAcceso, estatususuarioPatch);

// path : /api/v1/estatususuarios (DELETE)
// eliminar un estatus de usuario por id
estatususuarioRouter.delete('/:id', autorizaAcceso, estatususuarioDelete);

export default estatususuarioRouter;