// importar módulos necesarios y variables de entorno
import express from 'express';
import { PORT } from './config/env.js';

// importar conexión a la base de datos
import connection from './database/mysql.js';

// importar rutas para autenticación
import authRouter from './routes/login/auth.routes.js';

// importar rutas para usuarios
import usuarioRouter from './routes/usuarios/usuarios.routes.js';
import generoRouter from './routes/usuarios/generos.routes.js';
import grupoRouter from './routes/grupos/grupos.routes.js';
import estadoRouter from './routes/usuarios/estados.routes.js';
import municipioRouter from './routes/usuarios/municipios.routes.js';
import categoriasviviendaRouter from './routes/usuarios/categoriaviviendas.routes.js';
import estatusmaritalRouter from './routes/usuarios/estatusmaritales.routes.js';
import estatususuarioRouter from './routes/usuarios/estatususuarios.routes.js';
import tiposusuarioRouter from './routes/usuarios/tiposusuarios.routes.js';

// importar rutas para matriz de accesos
import vistaRouter from './routes/matriz/vistas.routes.js';
import matrizaccesorouter from './routes/matriz/matrizacceso.routes.js';

// importar rutas para proveedores
// import proveedorRouter from './routes/proveedores/proveedores.routes.js';

import cookieParser from 'cookie-parser';
import session from "express-session";
import { SESSION_SECRET, NODE_ENV } from './config/env.js';

// importar CORS middleware personalizado
import { corsMiddleware } from './middleware/corsmiddleware.js';

// importar middleware de manejo de errores
import { errorMiddleware } from "./middleware/error.middleware.js";

// ********************************************************************************************
// ********************************************************************************************
// INICIALIZACIÓN DE EXPRESS

const app = express();

// ********************************************************************************************
// ********************************************************************************************
// MIDDLEWARES GENERALES

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // para obtener cookies, no es para datos sensibles

// Seguridad global avanzada
app.disable("x-powered-by");  // Ocultar framework

// Límite de payloads (evita ataques DoS por grandes cargas)
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ limit: "200kb", extended: true }));

// Middleware de sanitización básica
app.use((req, res, next) => {
    const forbidden = ["$", "{", "}", "<", ">", ";"];
    const bodyStr = JSON.stringify(req.body);
    const queryStr = JSON.stringify(req.query);

    if (forbidden.some(char => bodyStr.includes(char) || queryStr.includes(char))) {
        return res.status(400).json({
            success: false,
            message: "Solicitud con caracteres no permitidos"
        });
    }
    next();
});

// Middleware para permitir solo métodos comunes
app.use((req, res, next) => {
    const allowedMethods = ["GET","POST","PUT","PATCH","DELETE","OPTIONS"];
    if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({
            success: false,
            message: `Método HTTP no permitido: ${req.method}`
        });
    }
    next();
});

// ********************************************************************************************
// ********************************************************************************************
// CONFIGURACIÓN DE CORS
// Colocar CORS antes de registrar rutas, sesiones y middlewares

app.use(corsMiddleware());

// Preflight global
app.options("*", corsMiddleware());

// ********************************************************************************************
// ********************************************************************************************
// INICIALIZACIÓN DE SESSION MIDDLEWARE

app.use(session({
    name: 'amigo',
    secret: SESSION_SECRET || 'keyboard_cat_dev',
    resave: false,
    saveUninitialized: true, // evita crear sessions innecesarias
    cookie: {
        secure: NODE_ENV === 'development', // true solo si usas HTTPS
        ttpOnly: true,
        maxAge: 1000 * 60 // 1 minuto el resultado de la multiplicación es 60,000 milisegundos, que es igual a 1 minuto.
        //maxAge: 1000 * 60 * 60 // 1 hora el resultado de la multiplicación es 3,600,000 milisegundos, que es igual a 1 hora.
        //maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));


// ********************************************************************************************
// ********************************************************************************************
// REGISTRO DE RUTAS
// registrar rutas DESPUÉS de la definición de la session middleware

// registrar rutas para autenticación
app.use('/api/v1/auth', authRouter);

// registrar vista
app.use('/api/v1/vistas', vistaRouter);

// registrar matriz de accesos
app.use('/api/v1/matrizaccesos', matrizaccesorouter);

// registrar rutas para usuarios
// api principal para los usuarios
app.use('/api/v1/usuarios', usuarioRouter);

// api principal para los generos
app.use('/api/v1/generos', generoRouter);

// api principal para los estados
app.use('/api/v1/estados', estadoRouter);

// api principal para los municipios
app.use('/api/v1/municipios', municipioRouter);

// api principal para los estatus maritales
app.use('/api/v1/estatusmaritales', estatusmaritalRouter);

// api principal para los estatus de usuarios
app.use('/api/v1/estatususuarios', estatususuarioRouter);

// api principal para las categorias de viviendas
app.use('/api/v1/categoriasviviendas', categoriasviviendaRouter);

// api principal para los tipos de usuarios
app.use('/api/v1/tiposusuarios', tiposusuarioRouter);

// api principal para las encuestas
//app.use('/api/v1/encuestas', encuestaRouter);

// api principal para los grupos
app.use('/api/v1/grupos', grupoRouter);

// api principal para los proveedores
//app.use('/api/v1/proveedores', proveedorRouter);


// ********************************************************************************************
// ********************************************************************************************
// MIDDLEWARE GLOBAL PARA RUTAS NO ENCONTRADAS Y ERRORES

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
        path: req.originalUrl
    });
});


// Middleware Global para Errores
app.use((err, req, res) => {
    console.error("🔥 Error interno:", err);

    return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: NODE_ENV === "development" ? err.message : undefined
    });
});

// Middleware Global de Errores
app.use(errorMiddleware);


// ********************************************************************************************
// ********************************************************************************************
// INICIO DEL SERVIDOR

app.listen(PORT, async () => {
    await connection();
    console.log(`Server is running on http://localhost:${ PORT }`);
});

export default app;

