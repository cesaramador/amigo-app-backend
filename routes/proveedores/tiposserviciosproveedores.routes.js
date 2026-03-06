import { Router } from 'express';
import {
    tiposserviciosproveedoresGet,
    tiposserviciosproveedoresGetById,
    tiposserviciosproveedoresPost,
    tiposserviciosproveedoresPut,
    tiposserviciosproveedoresPatch,
    tiposserviciosproveedoresDelete
} from '../../controllers/proveedores/tiposserviciosproveedores.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';

const tiposserviciosproveedoresRouter = Router();

// path : /api/v1/tiposserviciosproveedores (GET)
// leer todas las publicaciones
tiposserviciosproveedoresRouter.get('/', autorizaAcceso, tiposserviciosproveedoresGet);

// path : /api/v1/tiposserviciosproveedores/:id (GET)
// leer una publicacion por id
tiposserviciosproveedoresRouter.get('/:id', autorizaAcceso, tiposserviciosproveedoresGetById);

// path : /api/v1/tiposserviciosproveedores (POST)
// crear una nueva publicacion
tiposserviciosproveedoresRouter.post('/', autorizaAcceso, tiposserviciosproveedoresPost);

// path : /api/v1/tiposserviciosproveedores/:id (PUT)
// actualizar una publicacion por id
tiposserviciosproveedoresRouter.put('/:id', autorizaAcceso, tiposserviciosproveedoresPut);

// path : /api/v1/tiposserviciosproveedores/:id (PATCH)
// actualizar parcialmente una publicacion por id
tiposserviciosproveedoresRouter.patch('/:id', autorizaAcceso, tiposserviciosproveedoresPatch);

// path : /api/v1/tiposserviciosproveedores/:id (DELETE)
// eliminar una publicacion por id
tiposserviciosproveedoresRouter.delete('/:id', autorizaAcceso, tiposserviciosproveedoresDelete);

export default tiposserviciosproveedoresRouter;
