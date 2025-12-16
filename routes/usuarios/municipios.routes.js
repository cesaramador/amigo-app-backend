import { Router } from 'express';
import { municipiosGet, 
    municipioGetById, 
    municipioPost, 
    municipioPut, 
    municipioPatch, 
    municipioDelete } 
    from '../../controllers/usuarios/municipios.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const municipioRouter = Router();

// path : /api/v1/municipios (GET)
// leer todos los municipios
municipioRouter.get('/', autorizaAcceso, municipiosGet);

// path : /api/v1/municipios (GET)
// leer un municipio por id
municipioRouter.get('/:id', autorizaAcceso, municipioGetById);

// path : /api/v1/municipios (POST)
// crear un nuevo municipio
municipioRouter.post('/', autorizaAcceso, municipioPost);

// path : /api/v1/municipios (PUT)
// actualizar un municipio por id
municipioRouter.put('/:id', autorizaAcceso, municipioPut);

// path : /api/v1/municipios (PATCH)
// actualizar un municipio por id
municipioRouter.patch('/:id', autorizaAcceso, municipioPatch);

// path : /api/v1/municipios (DELETE)
// eliminar un municipio por id
municipioRouter.delete('/:id', autorizaAcceso, municipioDelete);

export default municipioRouter;