import { Router } from 'express';
import {
    interpretacionresultadosGet,
    interpretacionresultadoGetById,
    interpretacionresultadoPost,
    interpretacionresultadoPut,
    interpretacionresultadoPatch,
    interpretacionresultadoDelete
} from '../../controllers/encuestas/interpretacionresultados.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const interpretacionresultadosRouter = Router();

// path : /api/v1/interpretacionresultados (GET)
// leer todas las interpretaciones de resultados
interpretacionresultadosRouter.get('/', autorizaAcceso, interpretacionresultadosGet);

// path : /api/v1/interpretacionresultados/:id (GET)
// leer una interpretacion de resultados por id
interpretacionresultadosRouter.get('/:id', autorizaAcceso, interpretacionresultadoGetById);

// path : /api/v1/interpretacionresultados (POST)
// crear una nueva interpretacion de resultados
interpretacionresultadosRouter.post('/', autorizaAcceso, interpretacionresultadoPost);

// path : /api/v1/interpretacionresultados/:id (PUT)
// actualizar una interpretacion de resultados por id
interpretacionresultadosRouter.put('/:id', autorizaAcceso, interpretacionresultadoPut);

// path : /api/v1/interpretacionresultados/:id (PATCH)
// actualizar parcialmente una interpretacion de resultados por id
interpretacionresultadosRouter.patch('/:id', autorizaAcceso, interpretacionresultadoPatch);

// path : /api/v1/interpretacionresultados/:id (DELETE)
// eliminar una interpretacion de resultados por id
interpretacionresultadosRouter.delete('/:id', autorizaAcceso, interpretacionresultadoDelete);

export default interpretacionresultadosRouter;
