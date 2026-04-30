import { Router } from 'express';
import { estadosGet, 
    estadoGetById, 
    estadoPost, 
    estadoPut, 
    estadoPatch, 
    estadoDelete } 
    from '../../controllers/usuarios/estados.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    estadosGetValidation,
    idEstadoParamValidation,
    estadoBodyRequiredValidation,
    estadoBodyPatchValidation
} from '../../middleware/usuarios/estados.validator.js';

const estadoRouter = Router();

// path : /api/v1/estados (GET)
// leer todos los estados
estadoRouter.get('/', estadosGetValidation, estadosGet);

// path : /api/v1/estados (GET)
// leer un estado por id
estadoRouter.get('/:id', autorizaAcceso, idEstadoParamValidation, estadoGetById);

// path : /api/v1/estados (POST)
// crear un nuevo estado
estadoRouter.post('/', autorizaAcceso, estadoBodyRequiredValidation, estadoPost);

// path : /api/v1/estados (PUT)
// actualizar un estado por id
estadoRouter.put('/:id', autorizaAcceso, idEstadoParamValidation, estadoBodyRequiredValidation, estadoPut);

// path : /api/v1/estados (PATCH)
// actualizar un estado por id
estadoRouter.patch('/:id', autorizaAcceso, idEstadoParamValidation, estadoBodyPatchValidation, estadoPatch);

// path : /api/v1/estados (DELETE)
// eliminar un estado por id
estadoRouter.delete('/:id', autorizaAcceso, idEstadoParamValidation, estadoDelete);

export default estadoRouter;