import { Router } from 'express';
import { tiposusuariosGet, 
    tipousuarioGetById, 
    tipousuarioPost, 
    tipousuarioPut, 
    tipousuarioPatch, 
    tipousuarioDelete } 
    from '../../controllers/usuarios/tiposusuarios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    tiposusuariosGetValidation,
    idTipoUsuarioParamValidation,
    tipoUsuarioBodyRequiredValidation,
    tipoUsuarioBodyPatchValidation
} from '../../middleware/usuarios/tiposusuarios.validator.js';

const tiposusuarioRouter = Router();

// path : /api/v1/tiposusuarios (GET)
// leer todos los tipos de usuarios
tiposusuarioRouter.get('/', tiposusuariosGetValidation, tiposusuariosGet);

// path : /api/v1/tiposusuarios (GET)
// leer un tipo de usuario por id
tiposusuarioRouter.get('/:id', autorizaAcceso, idTipoUsuarioParamValidation, tipousuarioGetById);

// path : /api/v1/tiposusuarios (POST)
// crear un nuevo tipo de usuario
tiposusuarioRouter.post('/', autorizaAcceso, tipoUsuarioBodyRequiredValidation, tipousuarioPost);

// path : /api/v1/tiposusuarios (PUT)
// actualizar un tipo de usuario por id
tiposusuarioRouter.put('/:id', autorizaAcceso, idTipoUsuarioParamValidation, tipoUsuarioBodyRequiredValidation, tipousuarioPut);

// path : /api/v1/tiposusuarios (PATCH)
// actualizar un tipo de usuario por id
tiposusuarioRouter.patch('/:id', autorizaAcceso, idTipoUsuarioParamValidation, tipoUsuarioBodyPatchValidation, tipousuarioPatch);

// path : /api/v1/tiposusuarios (DELETE)
// eliminar un tipo de usuario por id
tiposusuarioRouter.delete('/:id', autorizaAcceso, idTipoUsuarioParamValidation, tipousuarioDelete);

export default tiposusuarioRouter;