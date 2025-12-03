import { Router } from 'express';
import { categoriasviviendasGet, 
    categoriaviviendaGetById, 
    categoriaviviendaPost, 
    categoriaviviendaPut, 
    categoriaviviendaPatch, 
    categoriaviviendaDelete } 
    from '../../controllers/usuarios/categoriasviviendas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
//import errormiddleware from '../../middleware/error.middleware.js';

const categoriaviviendaRouter = Router();

// path : /api/v1/categoriasviviendas (GET)
// leer todos las categorias de viviendas
categoriaviviendaRouter.get('/', autorizaAcceso, categoriasviviendasGet);

// path : /api/v1/categoriasviviendas (GET)
// leer una categoria de vivienda por id
categoriaviviendaRouter.get('/:id', autorizaAcceso, categoriaviviendaGetById);

// path : /api/v1/categoriasviviendas (POST)
// crear una nueva categoria de vivienda
categoriaviviendaRouter.post('/', autorizaAcceso, categoriaviviendaPost);

// path : /api/v1/categoriasviviendas (PUT)
// actualizar una categoria de vivienda por id
categoriaviviendaRouter.put('/:id', autorizaAcceso, categoriaviviendaPut);

// path : /api/v1/categoriasviviendas (PATCH)
// actualizar una categoria de vivienda por id
categoriaviviendaRouter.patch('/:id', autorizaAcceso, categoriaviviendaPatch);

// path : /api/v1/categoriasviviendas (DELETE)
// eliminar una categoria de vivienda por id
categoriaviviendaRouter.delete('/:id', autorizaAcceso, categoriaviviendaDelete);

export default categoriaviviendaRouter;