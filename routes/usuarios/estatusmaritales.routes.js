import { Router } from 'express';
import { estatusmaritalesGet, 
    estatusmaritalGetById, 
    estatusmaritalPost, 
    estatusmaritalPut, 
    estatusmaritalPatch, 
    estatusmaritalDelete } 
    from '../../controllers/usuarios/estatusmaritales.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    estatusmaritalesGetValidation,
    idEstatusMaritalParamValidation,
    estatusMaritalBodyRequiredValidation,
    estatusMaritalBodyPatchValidation
} from '../../middleware/usuarios/estatusmaritales.validator.js';

const estatusmaritalRouter = Router();

// path : /api/v1/estatusmaritales (GET)
// leer todos los estatus maritales
estatusmaritalRouter.get('/', estatusmaritalesGetValidation, estatusmaritalesGet);

// path : /api/v1/estatusmaritales (GET)
// leer un estatus marital por id
estatusmaritalRouter.get('/:id', autorizaAcceso, idEstatusMaritalParamValidation, estatusmaritalGetById);

// path : /api/v1/estatusmaritales (POST)
// crear un nuevo estatus marital
estatusmaritalRouter.post('/', autorizaAcceso, estatusMaritalBodyRequiredValidation, estatusmaritalPost);

// path : /api/v1/estatusmaritales (PUT)
// actualizar un estatus marital por id
estatusmaritalRouter.put('/:id', autorizaAcceso, idEstatusMaritalParamValidation, estatusMaritalBodyRequiredValidation, estatusmaritalPut);

// path : /api/v1/estatusmaritales (PATCH)
// actualizar un estatus marital por id
estatusmaritalRouter.patch('/:id', autorizaAcceso, idEstatusMaritalParamValidation, estatusMaritalBodyPatchValidation, estatusmaritalPatch);

// path : /api/v1/estatusmaritales (DELETE)
// eliminar un estatus marital por id
estatusmaritalRouter.delete('/:id', autorizaAcceso, idEstatusMaritalParamValidation, estatusmaritalDelete);

export default estatusmaritalRouter;