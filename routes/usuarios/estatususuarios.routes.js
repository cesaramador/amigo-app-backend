import { Router } from 'express';
import { estatususuariosGet, 
    estatususuarioGetById, 
    estatususuarioPost, 
    estatususuarioPut, 
    estatususuarioPatch, 
    estatususuarioDelete } 
    from '../../controllers/usuarios/estatususuarios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    estatususuariosGetValidation,
    idEstatusUsuarioParamValidation,
    estatusUsuarioBodyRequiredValidation,
    estatusUsuarioBodyPatchValidation
} from '../../middleware/usuarios/estatususuarios.validator.js';

const estatususuarioRouter = Router();

// path : /api/v1/estatususuarios (GET)
// leer todos los estatus de usuarios
estatususuarioRouter.get('/', autorizaAcceso, estatususuariosGetValidation, estatususuariosGet);

// path : /api/v1/estatususuarios (GET)
// leer un estatus de usuario por id
estatususuarioRouter.get('/:id', autorizaAcceso, idEstatusUsuarioParamValidation, estatususuarioGetById);

// path : /api/v1/estatususuarios (POST)
// crear un nuevo estatus de usuario
estatususuarioRouter.post('/', autorizaAcceso, estatusUsuarioBodyRequiredValidation, estatususuarioPost);

// path : /api/v1/estatususuarios (PUT)
// actualizar un estatus de usuario por id
estatususuarioRouter.put('/:id', autorizaAcceso, idEstatusUsuarioParamValidation, estatusUsuarioBodyRequiredValidation, estatususuarioPut);

// path : /api/v1/estatususuarios (PATCH)
// actualizar un estatus de usuario por id
estatususuarioRouter.patch('/:id', autorizaAcceso, idEstatusUsuarioParamValidation, estatusUsuarioBodyPatchValidation, estatususuarioPatch);

// path : /api/v1/estatususuarios (DELETE)
// eliminar un estatus de usuario por id
estatususuarioRouter.delete('/:id', autorizaAcceso, idEstatusUsuarioParamValidation, estatususuarioDelete);

export default estatususuarioRouter;