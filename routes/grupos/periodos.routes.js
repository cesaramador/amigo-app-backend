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
import {
    periodosGetValidation,
    idPeriodoParamValidation,
    periodoPostValidation,
    periodoPutValidation,
    periodoPatchValidation
} from '../../middleware/grupos/periodos.validator.js';

const periodosRouter = Router();

// path : /api/v1/periodos (GET)
// leer todos los periodos
periodosRouter.get('/', autorizaAcceso, periodosGetValidation, periodosGet);

// path : /api/v1/periodos/:id (GET)
// leer un periodo por id
periodosRouter.get('/:id', autorizaAcceso, idPeriodoParamValidation, periodoGetById);

// path : /api/v1/periodos (POST)
// crear un nuevo periodo
periodosRouter.post('/', autorizaAcceso, periodoPostValidation, periodoPost);

// path : /api/v1/periodos/:id (PUT)
// actualizar un periodo por id
periodosRouter.put('/:id', autorizaAcceso, idPeriodoParamValidation, periodoPutValidation, periodoPut);

// path : /api/v1/periodos/:id (PATCH)
// actualizar parcialmente un periodo por id
periodosRouter.patch('/:id', autorizaAcceso, idPeriodoParamValidation, periodoPatchValidation, periodoPatch);

// path : /api/v1/periodos/:id (DELETE)
// eliminar un periodo por id
periodosRouter.delete('/:id', autorizaAcceso, idPeriodoParamValidation, periodoDelete);

export default periodosRouter;
