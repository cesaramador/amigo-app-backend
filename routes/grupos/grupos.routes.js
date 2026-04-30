import { Router } from 'express';
import {
    gruposGet,
    grupoGetById,
    grupoPost,
    grupoPut,
    grupoPatch,
    grupoDelete
} from '../../controllers/grupos/grupos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    gruposGetValidation,
    idGrupoParamValidation,
    grupoPostValidation,
    grupoPutValidation,
    grupoPatchValidation
} from '../../middleware/grupos/grupos.validator.js';

const gruposRouter = Router();

// path : /api/v1/grupos (GET)
// leer todos los grupos
gruposRouter.get('/', autorizaAcceso, gruposGetValidation, gruposGet);

// path : /api/v1/grupos/:id (GET)
// leer un grupo por id
gruposRouter.get('/:id', autorizaAcceso, idGrupoParamValidation, grupoGetById);

// path : /api/v1/grupos (POST)
// crear un nuevo grupo
gruposRouter.post('/', autorizaAcceso, grupoPostValidation, grupoPost);

// path : /api/v1/grupos/:id (PUT)
// actualizar un grupo por id
gruposRouter.put('/:id', autorizaAcceso, idGrupoParamValidation, grupoPutValidation, grupoPut);

// path : /api/v1/grupos/:id (PATCH)
// actualizar parcialmente un grupo por id
gruposRouter.patch('/:id', autorizaAcceso, idGrupoParamValidation, grupoPatchValidation, grupoPatch);

// path : /api/v1/grupos/:id (DELETE)
// eliminar un grupo por id
gruposRouter.delete('/:id', autorizaAcceso, idGrupoParamValidation, grupoDelete);

export default gruposRouter;
