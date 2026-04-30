import { Router } from 'express';
import { municipiosGet, 
    municipioGetById, 
    municipioPost, 
    municipioPut, 
    municipioPatch, 
    municipioDelete } 
    from '../../controllers/usuarios/municipios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    municipiosGetValidation,
    idMunicipioParamValidation,
    municipioPostValidation,
    municipioPutValidation,
    municipioPatchValidation
} from '../../middleware/usuarios/municipios.validator.js';

const municipioRouter = Router();

// path : /api/v1/municipios (GET)
// leer todos los municipios
municipioRouter.get('/', municipiosGetValidation, municipiosGet);

// path : /api/v1/municipios (GET)
// leer un municipio por id
municipioRouter.get('/:id', autorizaAcceso, idMunicipioParamValidation, municipioGetById);

// path : /api/v1/municipios (POST)
// crear un nuevo municipio
municipioRouter.post('/', autorizaAcceso, municipioPostValidation, municipioPost);

// path : /api/v1/municipios (PUT)
// actualizar un municipio por id
municipioRouter.put('/:id', autorizaAcceso, idMunicipioParamValidation, municipioPutValidation, municipioPut);

// path : /api/v1/municipios (PATCH)
// actualizar un municipio por id
municipioRouter.patch('/:id', autorizaAcceso, idMunicipioParamValidation, municipioPatchValidation, municipioPatch);

// path : /api/v1/municipios (DELETE)
// eliminar un municipio por id
municipioRouter.delete('/:id', autorizaAcceso, idMunicipioParamValidation, municipioDelete);

export default municipioRouter;