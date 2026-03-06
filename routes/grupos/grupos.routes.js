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

const gruposRouter = Router();

// path : /api/v1/grupos (GET)
// leer todos los grupos
gruposRouter.get('/', autorizaAcceso, gruposGet);

// path : /api/v1/grupos/:id (GET)
// leer un grupo por id
gruposRouter.get('/:id', autorizaAcceso, grupoGetById);

// path : /api/v1/grupos (POST)
// crear un nuevo grupo
gruposRouter.post('/', autorizaAcceso, grupoPost);

// path : /api/v1/grupos/:id (PUT)
// actualizar un grupo por id
gruposRouter.put('/:id', autorizaAcceso, grupoPut);

// path : /api/v1/grupos/:id (PATCH)
// actualizar parcialmente un grupo por id
gruposRouter.patch('/:id', autorizaAcceso, grupoPatch);

// path : /api/v1/grupos/:id (DELETE)
// eliminar un grupo por id
gruposRouter.delete('/:id', autorizaAcceso, grupoDelete);

export default gruposRouter;
