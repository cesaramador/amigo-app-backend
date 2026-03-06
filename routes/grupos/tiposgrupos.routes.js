import { Router } from 'express';
import {
    tiposgruposGet,
    tiposgrupoGetById,
    tiposgrupoPost,
    tiposgrupoPut,
    tiposgrupoPatch,
    tiposgrupoDelete
} from '../../controllers/grupos/tiposgrupos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const tiposgruposRouter = Router();

// path : /api/v1/tiposgrupos (GET)
// leer todas los tipos de grupos
tiposgruposRouter.get('/', autorizaAcceso, tiposgruposGet);

// path : /api/v1/tiposgrupos/:id (GET)
// leer un tipo de grupo por id
tiposgruposRouter.get('/:id', autorizaAcceso, tiposgrupoGetById);

// path : /api/v1/tiposgrupos (POST)
// crear un nuevo tipo de grupo
tiposgruposRouter.post('/', autorizaAcceso, tiposgrupoPost);

// path : /api/v1/tiposgrupos/:id (PUT)
// actualizar un tipo de grupo por id
tiposgruposRouter.put('/:id', autorizaAcceso, tiposgrupoPut);

// path : /api/v1/tiposgrupos/:id (PATCH)
// actualizar parcialmente un tipo de grupo por id
tiposgruposRouter.patch('/:id', autorizaAcceso, tiposgrupoPatch);

// path : /api/v1/tiposgrupos/:id (DELETE)
// eliminar un tipo de grupo por id
tiposgruposRouter.delete('/:id', autorizaAcceso, tiposgrupoDelete);

export default tiposgruposRouter;
