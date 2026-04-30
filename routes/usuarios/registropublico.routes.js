import { Router } from 'express';
import { registroPublicoPost } from '../../controllers/usuarios/registropublico.controller.js';
import { registroPublicoPostValidation } from '../../middleware/usuarios/registropublico.validator.js';

const registroPublicoRouter = Router();

registroPublicoRouter.post('/', registroPublicoPostValidation, registroPublicoPost);

export default registroPublicoRouter;