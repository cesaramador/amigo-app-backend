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
import {
    interpretacionResultadosGetValidation,
    idInterpretacionResultadoParamValidation,
    interpretacionResultadoPostValidation,
    interpretacionResultadoPutValidation,
    interpretacionResultadoPatchValidation
} from '../../middleware/encuestas/interpretacionresultados.validator.js';

const interpretacionresultadosRouter = Router();

// path : /api/v1/interpretacionresultados (GET)
// leer todas las interpretaciones de resultados
interpretacionresultadosRouter.get('/', autorizaAcceso, interpretacionResultadosGetValidation, interpretacionresultadosGet);

// path : /api/v1/interpretacionresultados/:id (GET)
// leer una interpretacion de resultados por id
interpretacionresultadosRouter.get('/:id', autorizaAcceso, idInterpretacionResultadoParamValidation, interpretacionresultadoGetById);

// path : /api/v1/interpretacionresultados (POST)
// crear una nueva interpretacion de resultados
interpretacionresultadosRouter.post('/', autorizaAcceso, interpretacionResultadoPostValidation, interpretacionresultadoPost);

// path : /api/v1/interpretacionresultados/:id (PUT)
// actualizar una interpretacion de resultados por id
interpretacionresultadosRouter.put('/:id', autorizaAcceso, idInterpretacionResultadoParamValidation, interpretacionResultadoPutValidation, interpretacionresultadoPut);

// path : /api/v1/interpretacionresultados/:id (PATCH)
// actualizar parcialmente una interpretacion de resultados por id
interpretacionresultadosRouter.patch('/:id', autorizaAcceso, idInterpretacionResultadoParamValidation, interpretacionResultadoPatchValidation, interpretacionresultadoPatch);

// path : /api/v1/interpretacionresultados/:id (DELETE)
// eliminar una interpretacion de resultados por id
interpretacionresultadosRouter.delete('/:id', autorizaAcceso, idInterpretacionResultadoParamValidation, interpretacionresultadoDelete);

export default interpretacionresultadosRouter;
