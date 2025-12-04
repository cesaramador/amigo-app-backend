import { Router } from 'express';
import { registrar, iniciar, abandonar, obtenerMunicipiosPorEstado } from '../../controllers/login/auth.controller.js';

const authRouter = Router();

// path : /api/v1/auth/signUp (POST)
// registrar a un nuevo usuario
authRouter.post("/registrar", registrar);

// path : /api/v1/auth/signIn (POST)
// iniciar sesión
authRouter.post("/iniciar", iniciar);

// path : /api/v1/auth/signOut (POST)
// salir de la sesión
authRouter.post("/abandonar", abandonar);

// path : /api/v1/auth/municipios/:id_estado (GET)
// obtener municipios por estado
authRouter.get("/municipios/:id_estado", obtenerMunicipiosPorEstado);

export default authRouter;