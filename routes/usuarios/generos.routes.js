import { Router } from 'express';
import { generosGet, 
    generoGetById, 
    generoPost, 
    generoPut, 
    generoPatch, 
    generoDelete } 
    from '../../controllers/usuarios/generos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const generoRouter = Router();

// path : /api/v1/generos (GET)
// leer todos los generos
generoRouter.get('/', autorizaAcceso, generosGet);

// path : /api/v1/generos (GET)
// leer un genero por id
generoRouter.get('/:id', autorizaAcceso, generoGetById);

// path : /api/v1/generos (POST)
// crear un nuevo genero
generoRouter.post('/', autorizaAcceso, generoPost);

// path : /api/v1/generos (PUT)
// actualizar un genero por id
generoRouter.put('/:id', autorizaAcceso, generoPut);

// path : /api/v1/generos (PATCH)
// actualizar un genero por id
generoRouter.patch('/:id', autorizaAcceso, generoPatch);

// path : /api/v1/generos (DELETE)
// eliminar un genero por id
generoRouter.delete('/:id', autorizaAcceso, generoDelete);

export default generoRouter;