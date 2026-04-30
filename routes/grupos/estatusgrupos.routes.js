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
import {
    estatusGruposGetValidation,
    idEstatusGrupoParamValidation,
    estatusGrupoPostValidation,
    estatusGrupoPutValidation,
    estatusGrupoPatchValidation
} from '../../middleware/grupos/estatusgrupos.validator.js';

const estatusgruposRouter = Router();

// path : /api/v1/estatusgrupos (GET)
// leer todos los estatus de grupos
estatusgruposRouter.get('/', autorizaAcceso, estatusGruposGetValidation, estatusgruposGet);

// path : /api/v1/estatusgrupos/:id (GET)
// leer un estatus de grupo por id
estatusgruposRouter.get('/:id', autorizaAcceso, idEstatusGrupoParamValidation, estatusgrupoGetById);

// path : /api/v1/estatusgrupos (POST)
// crear un nuevo estatus de grupo
estatusgruposRouter.post('/', autorizaAcceso, estatusGrupoPostValidation, estatusgrupoPost);

// path : /api/v1/estatusgrupos/:id (PUT)
// actualizar un estatus de grupo por id
estatusgruposRouter.put('/:id', autorizaAcceso, idEstatusGrupoParamValidation, estatusGrupoPutValidation, estatusgrupoPut);

// path : /api/v1/estatusgrupos/:id (PATCH)
// actualizar parcialmente un estatus de grupo por id
estatusgruposRouter.patch('/:id', autorizaAcceso, idEstatusGrupoParamValidation, estatusGrupoPatchValidation, estatusgrupoPatch);

// path : /api/v1/estatusgrupos/:id (DELETE)
// eliminar un estatus de grupo por id
estatusgruposRouter.delete('/:id', autorizaAcceso, idEstatusGrupoParamValidation, estatusgrupoDelete);

export default estatusgruposRouter;
