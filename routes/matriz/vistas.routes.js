import { Router } from 'express';
import { vistasGet, 
    vistaGetById, 
    vistaPost, 
    vistaPut, 
    vistaPatch, 
    vistaDelete } 
    from '../../controllers/matriz/vistas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const vistaRouter = Router();

// path : /api/v1/vistas (GET)
// leer todos las vistas
vistaRouter.get('/', autorizaAcceso, vistasGet);

// path : /api/v1/vistas (GET)
// leer una categoria de vista
vistaRouter.get('/:id', autorizaAcceso, vistaGetById);

// path : /api/v1/vistas (POST)
// crear una nueva vista
vistaRouter.post('/', autorizaAcceso, vistaPost);

// path : /api/v1/vistas (PUT)
// actualizar una vista por id
vistaRouter.put('/:id', autorizaAcceso, vistaPut);

// path : /api/v1/vistas (PATCH)
// actualizar una vista por id
vistaRouter.patch('/:id', autorizaAcceso, vistaPatch);

// path : /api/v1/vistas (DELETE)
// eliminar una vista por id
vistaRouter.delete('/:id', autorizaAcceso,vistaDelete);

export default vistaRouter;