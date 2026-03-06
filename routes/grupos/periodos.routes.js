import { Router } from 'express';
import {
    periodosGet,
    periodoGetById,
    periodoPost,
    periodoPut,
    periodoPatch,
    periodoDelete
} from '../../controllers/grupos/periodos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const periodosRouter = Router();

// path : /api/v1/periodos (GET)
// leer todos los periodos
periodosRouter.get('/', autorizaAcceso, periodosGet);

// path : /api/v1/periodos/:id (GET)
// leer un periodo por id
periodosRouter.get('/:id', autorizaAcceso, periodoGetById);

// path : /api/v1/periodos (POST)
// crear un nuevo periodo
periodosRouter.post('/', autorizaAcceso, periodoPost);

// path : /api/v1/periodos/:id (PUT)
// actualizar un periodo por id
periodosRouter.put('/:id', autorizaAcceso, periodoPut);

// path : /api/v1/periodos/:id (PATCH)
// actualizar parcialmente un periodo por id
periodosRouter.patch('/:id', autorizaAcceso, periodoPatch);

// path : /api/v1/periodos/:id (DELETE)
// eliminar un periodo por id
periodosRouter.delete('/:id', autorizaAcceso, periodoDelete);

export default periodosRouter;
