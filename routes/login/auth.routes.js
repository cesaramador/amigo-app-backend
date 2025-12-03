import { Router } from 'express';
import { registrar, iniciar, abandonar } from '../../controllers/login/auth.controller.js';

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

export default authRouter;

// ********************************************************************************************************************
// ********************************************************************************************************************

// import { login, register } from "../controllers/auth.controller.js";
// import { validateSchema } from "../middlewares/validateSchema.js";
// import { loginSchema, registerSchema } from "../schemas/auth.schemas.js";

// ruteo sin validación de esquemas (ejemplos básicos)
// authRouter.post("/sign-up", (req, res) => res.send({ title: "Sign-up endpoint" }));
// authRouter.post("/sign-in", (req, res) => res.send({ title: "Sign-in endpoint" }));
// authRouter.post("/sign-out", (req, res) => res.send({ title: "Sign-out endpoint" }));

// ruteo sin validación de esquemas (ejemplos básicos)
// authRouter.post('/sign-up', (req, res) => {
//     res.send({ title: 'Sign-up endpoint' });
// });

// authRouter.post('/sign-in', (req, res) => {
//     res.send({ title: 'Sign-in endpoint' });
// });

// authRouter.post('/sign-out', (req, res) => {
//     res.send({ title: 'Sign-out endpoint' });
// });

// ruteo con validación de esquemas
// authRouter.post("/login", validateSchema(loginSchema), login);
// authRouter.post("/register", validateSchema(registerSchema), register);