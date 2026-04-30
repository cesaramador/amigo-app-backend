import { Router } from 'express';
import { categoriasviviendasGet, 
    categoriaviviendaGetById, 
    categoriaviviendaPost, 
    categoriaviviendaPut, 
    categoriaviviendaPatch, 
    categoriaviviendaDelete } 
    from '../../controllers/usuarios/categoriasviviendas.controller.js';
import autorizaAcceso from '../../middleware/auth.middleware.js';
import {
    categoriasViviendasGetValidation,
    idCategoriaViviendaParamValidation,
    categoriaViviendaBodyRequiredValidation,
    categoriaViviendaBodyPatchValidation
} from '../../middleware/usuarios/categoriasviviendas.validator.js';

const categoriaviviendaRouter = Router();

// path : /api/v1/categoriasviviendas (GET)
// leer todos las categorias de viviendas
categoriaviviendaRouter.get('/', categoriasViviendasGetValidation, categoriasviviendasGet);

// path : /api/v1/categoriasviviendas (GET)
// leer una categoria de vivienda por id
categoriaviviendaRouter.get('/:id', autorizaAcceso, idCategoriaViviendaParamValidation, categoriaviviendaGetById);

// path : /api/v1/categoriasviviendas (POST)
// crear una nueva categoria de vivienda
categoriaviviendaRouter.post('/', autorizaAcceso, categoriaViviendaBodyRequiredValidation, categoriaviviendaPost);

// path : /api/v1/categoriasviviendas (PUT)
// actualizar una categoria de vivienda por id
categoriaviviendaRouter.put('/:id', autorizaAcceso, idCategoriaViviendaParamValidation, categoriaViviendaBodyRequiredValidation, categoriaviviendaPut);

// path : /api/v1/categoriasviviendas (PATCH)
// actualizar una categoria de vivienda por id
categoriaviviendaRouter.patch('/:id', autorizaAcceso, idCategoriaViviendaParamValidation, categoriaViviendaBodyPatchValidation, categoriaviviendaPatch);

// path : /api/v1/categoriasviviendas (DELETE)
// eliminar una categoria de vivienda por id
categoriaviviendaRouter.delete('/:id', autorizaAcceso, idCategoriaViviendaParamValidation, categoriaviviendaDelete);

export default categoriaviviendaRouter;