import { Router } from 'express';
import { generosGet, 
    generoGetById, 
    generoPost, 
    generoPut, 
    generoPatch, 
    generoDelete } 
    from '../../controllers/usuarios/generos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    generosGetValidation,
    idGeneroParamValidation,
    generoBodyRequiredValidation,
    generoBodyPatchValidation
} from '../../middleware/usuarios/generos.validator.js';

const generoRouter = Router();

// path : /api/v1/generos (GET)
// leer todos los generos
generoRouter.get('/', generosGetValidation, generosGet);

// path : /api/v1/generos (GET)
// leer un genero por id
generoRouter.get('/:id', autorizaAcceso, idGeneroParamValidation, generoGetById);

// path : /api/v1/generos (POST)
// crear un nuevo genero
generoRouter.post('/', autorizaAcceso, generoBodyRequiredValidation, generoPost);

// path : /api/v1/generos (PUT)
// actualizar un genero por id
generoRouter.put('/:id', autorizaAcceso, idGeneroParamValidation, generoBodyRequiredValidation, generoPut);

// path : /api/v1/generos (PATCH)
// actualizar un genero por id
generoRouter.patch('/:id', autorizaAcceso, idGeneroParamValidation, generoBodyPatchValidation, generoPatch);

// path : /api/v1/generos (DELETE)
// eliminar un genero por id
generoRouter.delete('/:id', autorizaAcceso, idGeneroParamValidation, generoDelete);

export default generoRouter;