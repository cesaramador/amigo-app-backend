import { Router } from 'express';
import {
    registrar,
    iniciar,
    abandonar,
    obtenerCategoriasViviendasPublicas,
    obtenerEstatusMaritalesPublicos,
    obtenerEstatusUsuariosPublicos,
    obtenerEstadosPublicos,
    obtenerGenerosPublicos,
    obtenerMunicipiosPorEstado,
    obtenerTiposUsuariosPublicos,
    recuperarCodigo
} from '../../controllers/login/auth.controller.js';
import { validarRecuperacionCodigo } from '../../middleware/recuperar-codigo.middleware.js';

const authRouter = Router();

// path : /api/v1/auth/signUp (POST)
// registrar a un nuevo usuario
authRouter.post("/registrar", registrar);

// path : /api/v1/auth/signIn (POST)
// iniciar sesión
authRouter.post("/iniciar", iniciar);

// path : /api/v1/auth/recuperar-codigo (POST)
// recuperar código de acceso por teléfono + email (sin autorizaAcceso)
authRouter.post("/recuperar-codigo", validarRecuperacionCodigo, recuperarCodigo);

// path : /api/v1/auth/signOut (POST)
// salir de la sesión
authRouter.post("/abandonar", abandonar);

// path : /api/v1/auth/municipios/:id_estado (GET)
// obtener municipios por estado
authRouter.get("/municipios/:id_estado", obtenerMunicipiosPorEstado);

// path : /api/v1/auth/tipos-usuarios (GET)
// obtener catálogo público de tipos de usuario
authRouter.get("/tipos-usuarios", obtenerTiposUsuariosPublicos);

// path : /api/v1/auth/estados (GET)
// obtener catálogo público de estados
authRouter.get("/estados", obtenerEstadosPublicos);

// path : /api/v1/auth/generos (GET)
// obtener catálogo público de géneros
authRouter.get("/generos", obtenerGenerosPublicos);

// path : /api/v1/auth/estatus-usuarios (GET)
// obtener catálogo público de estatus de usuario
authRouter.get("/estatus-usuarios", obtenerEstatusUsuariosPublicos);

// path : /api/v1/auth/estatus-maritales (GET)
// obtener catálogo público de estatus maritales
authRouter.get("/estatus-maritales", obtenerEstatusMaritalesPublicos);

// path : /api/v1/auth/categorias-viviendas (GET)
// obtener catálogo público de categorías de vivienda
authRouter.get("/categorias-viviendas", obtenerCategoriasViviendasPublicas);

export default authRouter;