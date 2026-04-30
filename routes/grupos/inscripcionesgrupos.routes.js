import { Router } from 'express';
import {
    inscripcionesgruposGet,
    inscripcionesgrupoGetById,
    inscripcionesgrupoPost,
    inscripcionesgrupoPut,
    inscripcionesgrupoPatch,
    inscripcionesgrupoDelete
} from '../../controllers/grupos/inscripcionesgrupos.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    inscripcionesGruposGetValidation,
    idInscripcionGrupoParamValidation,
    inscripcionesGrupoPostValidation,
    inscripcionesGrupoPutValidation,
    inscripcionesGrupoPatchValidation
} from '../../middleware/grupos/inscripcionesgrupos.validator.js';

const inscripcionesgruposRouter = Router();

// path : /api/v1/inscripcionesgrupos (GET)
// leer todas las inscripciones de grupos
inscripcionesgruposRouter.get('/', autorizaAcceso, inscripcionesGruposGetValidation, inscripcionesgruposGet);

// path : /api/v1/inscripcionesgrupos/:id (GET)
// leer una inscripcion de grupo por id
inscripcionesgruposRouter.get('/:id', autorizaAcceso, idInscripcionGrupoParamValidation, inscripcionesgrupoGetById);

// path : /api/v1/inscripcionesgrupos (POST)
// crear una nueva inscripcion de grupo
inscripcionesgruposRouter.post('/', autorizaAcceso, inscripcionesGrupoPostValidation, inscripcionesgrupoPost);

// path : /api/v1/inscripcionesgrupos/:id (PUT)
// actualizar una inscripcion de grupo por id
inscripcionesgruposRouter.put('/:id', autorizaAcceso, idInscripcionGrupoParamValidation, inscripcionesGrupoPutValidation, inscripcionesgrupoPut);

// path : /api/v1/inscripcionesgrupos/:id (PATCH)
// actualizar parcialmente una inscripcion de grupo por id
inscripcionesgruposRouter.patch('/:id', autorizaAcceso, idInscripcionGrupoParamValidation, inscripcionesGrupoPatchValidation, inscripcionesgrupoPatch);

// path : /api/v1/inscripcionesgrupos/:id (DELETE)
// eliminar una inscripcion de grupo por id
inscripcionesgruposRouter.delete('/:id', autorizaAcceso, idInscripcionGrupoParamValidation, inscripcionesgrupoDelete);

export default inscripcionesgruposRouter;
