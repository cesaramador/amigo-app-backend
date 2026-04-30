import { Router } from 'express';
import {
    periodosgruposGet,
    periodosgrupoGetById,
    periodosgrupoPost,
    periodosgrupoPut,
    periodosgrupoPatch,
    periodosgrupoDelete
} from '../../controllers/grupos/periodosgrupos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    periodosGruposGetValidation,
    idPeriodoGrupoParamValidation,
    periodosGrupoPostValidation,
    periodosGrupoPutValidation,
    periodosGrupoPatchValidation
} from '../../middleware/grupos/periodosgrupos.validator.js';

const periodosgruposRouter = Router();

// path : /api/v1/periodosgrupos (GET)
// leer todos los periodos de grupos
periodosgruposRouter.get('/', autorizaAcceso, periodosGruposGetValidation, periodosgruposGet);

// path : /api/v1/periodosgrupos/:id (GET)
// leer un periodo de grupo por id
periodosgruposRouter.get('/:id', autorizaAcceso, idPeriodoGrupoParamValidation, periodosgrupoGetById);

// path : /api/v1/periodosgrupos (POST)
// crear un nuevo periodo de grupo
periodosgruposRouter.post('/', autorizaAcceso, periodosGrupoPostValidation, periodosgrupoPost);

// path : /api/v1/periodosgrupos/:id (PUT)
// actualizar un periodo de grupo por id
periodosgruposRouter.put('/:id', autorizaAcceso, idPeriodoGrupoParamValidation, periodosGrupoPutValidation, periodosgrupoPut);

// path : /api/v1/periodosgrupos/:id (PATCH)
// actualizar parcialmente un periodo de grupo por id
periodosgruposRouter.patch('/:id', autorizaAcceso, idPeriodoGrupoParamValidation, periodosGrupoPatchValidation, periodosgrupoPatch);

// path : /api/v1/periodosgrupos/:id (DELETE)
// eliminar un periodo de grupo por id
periodosgruposRouter.delete('/:id', autorizaAcceso, idPeriodoGrupoParamValidation, periodosgrupoDelete);

export default periodosgruposRouter;
