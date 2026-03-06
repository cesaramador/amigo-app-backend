import { Router } from 'express';
import {
    estatusgruposGet,
    estatusgrupoGetById,
    estatusgrupoPost,
    estatusgrupoPut,
    estatusgrupoPatch,
    estatusgrupoDelete
} from '../../controllers/grupos/estatusgrupos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const estatusgruposRouter = Router();

// path : /api/v1/estatusgrupos (GET)
// leer todos los estatus de grupos
estatusgruposRouter.get('/', autorizaAcceso, estatusgruposGet);

// path : /api/v1/estatusgrupos/:id (GET)
// leer un estatus de grupo por id
estatusgruposRouter.get('/:id', autorizaAcceso, estatusgrupoGetById);

// path : /api/v1/estatusgrupos (POST)
// crear un nuevo estatus de grupo
estatusgruposRouter.post('/', autorizaAcceso, estatusgrupoPost);

// path : /api/v1/estatusgrupos/:id (PUT)
// actualizar un estatus de grupo por id
estatusgruposRouter.put('/:id', autorizaAcceso, estatusgrupoPut);

// path : /api/v1/estatusgrupos/:id (PATCH)
// actualizar parcialmente un estatus de grupo por id
estatusgruposRouter.patch('/:id', autorizaAcceso, estatusgrupoPatch);

// path : /api/v1/estatusgrupos/:id (DELETE)
// eliminar un estatus de grupo por id
estatusgruposRouter.delete('/:id', autorizaAcceso, estatusgrupoDelete);

export default estatusgruposRouter;
