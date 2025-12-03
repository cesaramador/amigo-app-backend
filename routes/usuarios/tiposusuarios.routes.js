import { Router } from 'express';
import { tiposusuariosGet, 
    tipousuarioGetById, 
    tipousuarioPost, 
    tipousuarioPut, 
    tipousuarioPatch, 
    tipousuarioDelete } 
    from '../../controllers/usuarios/tiposusuarios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const tiposusuarioRouter = Router();

// path : /api/v1/tiposusuarios (GET)
// leer todos los tipos de usuarios
tiposusuarioRouter.get('/', autorizaAcceso, tiposusuariosGet);

// path : /api/v1/tiposusuarios (GET)
// leer un tipo de usuario por id
tiposusuarioRouter.get('/:id', autorizaAcceso, tipousuarioGetById);

// path : /api/v1/tiposusuarios (POST)
// crear un nuevo tipo de usuario
tiposusuarioRouter.post('/', autorizaAcceso, tipousuarioPost);

// path : /api/v1/tiposusuarios (PUT)
// actualizar un tipo de usuario por id
tiposusuarioRouter.put('/:id', tipousuarioPut);

// path : /api/v1/tiposusuarios (PATCH)
// actualizar un tipo de usuario por id
tiposusuarioRouter.patch('/:id', tipousuarioPatch);

// path : /api/v1/tiposusuarios (DELETE)
// eliminar un tipo de usuario por id
tiposusuarioRouter.delete('/:id', tipousuarioDelete);

export default tiposusuarioRouter;