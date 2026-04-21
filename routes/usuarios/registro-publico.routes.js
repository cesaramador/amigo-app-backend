import { Router } from 'express';
import { validarRegistroPublico } from '../../middleware/registro-publico.middleware.js';
import { registroPublicoPost } from '../../controllers/usuarios/registro-publico.controller.js';

const registroPublicoRouter = Router();

registroPublicoRouter.post('/', validarRegistroPublico, registroPublicoPost);

export default registroPublicoRouter;
