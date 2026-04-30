import { Router } from 'express';
import {
    detalleusuariosencuestasGet,
    detalleusuarioencuestaGetById,
    detalleusuarioencuestaPost,
    detalleusuarioencuestaPut,
    detalleusuarioencuestaPatch,
    detalleusuarioencuestaDelete
} from '../../controllers/encuestas/detalleusuariosencuestas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    detalleUsuariosEncuestasGetValidation,
    idDetalleUsuarioEncuestaParamValidation,
    detalleUsuarioEncuestaPostValidation,
    detalleUsuarioEncuestaPutValidation,
    detalleUsuarioEncuestaPatchValidation
} from '../../middleware/encuestas/detalleusuariosencuestas.validator.js';

const detalleusuariosencuestasRouter = Router();

// path : /api/v1/detalleusuariosencuestas (GET)
// leer todas las publicaciones
detalleusuariosencuestasRouter.get('/', autorizaAcceso, detalleUsuariosEncuestasGetValidation, detalleusuariosencuestasGet);

// path : /api/v1/detalleusuariosencuestas/:id (GET)
// leer una publicacion por id
detalleusuariosencuestasRouter.get('/:id', autorizaAcceso, idDetalleUsuarioEncuestaParamValidation, detalleusuarioencuestaGetById);

// path : /api/v1/detalleusuariosencuestas (POST)
// crear una nueva publicacion
detalleusuariosencuestasRouter.post('/', autorizaAcceso, detalleUsuarioEncuestaPostValidation, detalleusuarioencuestaPost);

// path : /api/v1/detalleusuariosencuestas/:id (PUT)
// actualizar una publicacion por id
detalleusuariosencuestasRouter.put('/:id', autorizaAcceso, idDetalleUsuarioEncuestaParamValidation, detalleUsuarioEncuestaPutValidation, detalleusuarioencuestaPut);

// path : /api/v1/detalleusuariosencuestas/:id (PATCH)
// actualizar parcialmente una publicacion por id
detalleusuariosencuestasRouter.patch('/:id', autorizaAcceso, idDetalleUsuarioEncuestaParamValidation, detalleUsuarioEncuestaPatchValidation, detalleusuarioencuestaPatch);

// path : /api/v1/detalleusuariosencuestas/:id (DELETE)
// eliminar una publicacion por id
detalleusuariosencuestasRouter.delete('/:id', autorizaAcceso, idDetalleUsuarioEncuestaParamValidation, detalleusuarioencuestaDelete);

export default detalleusuariosencuestasRouter;
