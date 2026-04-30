import { Router } from 'express';
import { usuariosGet, 
    usuarioGetById, 
    usuarioPost, 
    usuarioPut, 
    usuarioPatch, 
    usuarioDelete } 
    from '../../controllers/usuarios/usuarios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    usuariosGetValidation,
    idUsuarioParamValidation,
    usuarioPostValidation,
    usuarioPutValidation,
    usuarioPatchValidation
} from '../../middleware/usuarios/usuarios.validator.js';

const usuarioRouter = Router();

// path : /api/v1/usuarios (GET)
// leer todos los usuarios "OK"
usuarioRouter.get('/', autorizaAcceso, usuariosGetValidation, usuariosGet);

// path : /api/v1/usuarios (GET)
// leer un usuario por id "OK"
//usuarioRouter.get('/:id', autoriza, errormiddleware, usuariosGetById);
usuarioRouter.get('/:id', autorizaAcceso, idUsuarioParamValidation, usuarioGetById);

// path : /api/v1/usuarios (POST)
// crear un nuevo usuario "OK"
usuarioRouter.post('/', autorizaAcceso, usuarioPostValidation, usuarioPost);

// path : /api/v1/usuarios (PUT)
// actualizar un usuario por id "OK"
usuarioRouter.put('/:id', autorizaAcceso, idUsuarioParamValidation, usuarioPutValidation, usuarioPut);

// path : /api/v1/usuarios (PATCH)
// actualizar un usuario por id "OK"
usuarioRouter.patch('/:id', autorizaAcceso, idUsuarioParamValidation, usuarioPatchValidation, usuarioPatch);

// path : /api/v1/usuarios (DELETE)
// eliminar un usuario por id "OK"
usuarioRouter.delete('/:id', autorizaAcceso, idUsuarioParamValidation, usuarioDelete);

export default usuarioRouter;