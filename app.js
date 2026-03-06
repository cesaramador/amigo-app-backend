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
import estadoRouter from './routes/usuarios/estados.routes.js';
import municipioRouter from './routes/usuarios/municipios.routes.js';
import categoriasviviendaRouter from './routes/usuarios/categoriaviviendas.routes.js';
import estatusmaritalRouter from './routes/usuarios/estatusmaritales.routes.js';
import estatususuarioRouter from './routes/usuarios/estatususuarios.routes.js';
import tiposusuarioRouter from './routes/usuarios/tiposusuarios.routes.js';

// importar rutas para matriz de accesos
import vistaRouter from './routes/matriz/vistas.routes.js';
import matrizaccesorouter from './routes/matriz/matrizacceso.routes.js';

// importar rutas para encuestas
import detalleusuariosencuestasRouter from './routes/encuestas/detalleusuariosencuestas.routes.js'
import encuestasRouter from './routes/encuestas/encuestas.routes.js';
import encuestaspreguntasrespuestasRouter from './routes/encuestas/encuestaspreguntasrespuestas.routes.js';
import interpretacionresultadosRouter from './routes/encuestas/interpretacionresultados.routes.js';
import preguntasRouter from './routes/encuestas/preguntas.routes.js';
import respuestasRouter from './routes/encuestas/respuestas.routes.js';
import tipoencuestasRouter from './routes/encuestas/tipoencuestas.routes.js';
import usuariosencuestasRouter from './routes/encuestas/usuariosencuestas.routes.js';

// importar rutas para los grupos
import asistenciaRouter from './routes/grupos/asistencia.routes.js';
import estatusgruposRouter from './routes/grupos/estatusgrupos.routes.js';
import gruposRouter from './routes/grupos/grupos.routes.js';
import inscripcionesgruposRouter from './routes/grupos/inscripcionesgrupos.routes.js';
import periodosRouter from './routes/grupos/periodos.routes.js';
import periodosgruposRouter from './routes/grupos/periodosgrupos.routes.js';
import tiposgruposRouter from './routes/grupos/tiposgrupos.routes.js';

// importar rutas para proveedores
import estatuspublicacionesRouter from './routes/proveedores/estatuspublicaciones.routes.js';
import proveedoresconserviciosRouter from './routes/proveedores/proveedoresconservicios.routes.js';
import publicacionesRouter from './routes/proveedores/publicaciones.routes.js';
import serviciosproveedoresRouter from './routes/proveedores/serviciosproveedores.routes.js';
import tiposserviciosproveedoresRouter from './routes/proveedores/tiposserviciosproveedores.routes.js';

// importar accesorios
import cookieParser from 'cookie-parser';
import session from "express-session";
import { SESSION_SECRET, NODE_ENV } from './config/env.js';

// importar CORS middleware personalizado
import { corsMiddleware } from './middleware/corsmiddleware.js';

// importar middleware de manejo de errores
import { errorMiddleware } from "./middleware/error.middleware.js";

// importar security middleware personalizado
import securityMiddleware from "./middleware/security.middleware.js";

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
// INICIALIZACIÓN DE SECUTITY MIDDLEWARE

// Debe ir ANTES de las rutas
app.use(securityMiddleware({
  mode: "reject",
  whitelistParams: [
    "nombre", "email", "telefono", "direccion",
    "id_estado", "id_municipio"
  ]
}));


// ********************************************************************************************
// ********************************************************************************************
// REGISTRO DE RUTAS
// registrar rutas DESPUÉS de la definición de la session middleware

// ********************************************************************************************
// registrar rutas para autenticación
app.use('/api/v1/auth', authRouter);

// registrar vista
app.use('/api/v1/vistas', vistaRouter);

// registrar matriz de accesos
app.use('/api/v1/matrizaccesos', matrizaccesorouter);

// ********************************************************************************************
// api para los usuarios
app.use('/api/v1/usuarios', usuarioRouter);
app.use('/api/v1/generos', generoRouter);
app.use('/api/v1/estados', estadoRouter);
app.use('/api/v1/municipios', municipioRouter);
app.use('/api/v1/estatusmaritales', estatusmaritalRouter);
app.use('/api/v1/estatususuarios', estatususuarioRouter);
app.use('/api/v1/categoriasviviendas', categoriasviviendaRouter);
app.use('/api/v1/tiposusuarios', tiposusuarioRouter);

// ********************************************************************************************
// api para los grupos
app.use('/api/v1/asistencia', asistenciaRouter);
app.use('/api/v1/estatusgrupos', estatusgruposRouter);
app.use('/api/v1/grupos', gruposRouter);
app.use('/api/v1/inscripcionesgrupos', inscripcionesgruposRouter);
app.use('/api/v1/periodos', periodosRouter);
app.use('/api/v1/periodosgrupos', periodosgruposRouter);
app.use('/api/v1/tiposgrupos', tiposgruposRouter);

// ********************************************************************************************
// api para las encuestas
app.use('/api/v1/detalleusuariosencuestas', detalleusuariosencuestasRouter);
app.use('/api/v1/encuestas', encuestasRouter);
app.use('/api/v1/encuestaspreguntasrespuestas', encuestaspreguntasrespuestasRouter);
app.use('/api/v1/interpretacionresultados', interpretacionresultadosRouter);
app.use('/api/v1/preguntas', preguntasRouter);
app.use('/api/v1/respuestas', respuestasRouter);
app.use('/api/v1/tipoencuestas', tipoencuestasRouter);
app.use('/api/v1/usuariosencuestas', usuariosencuestasRouter);

// ********************************************************************************************
// api principal para los proveedores
app.use('/api/v1/estatuspublicaciones', estatuspublicacionesRouter);
app.use('/api/v1/proveedoresconservicios', proveedoresconserviciosRouter);
app.use('/api/v1/publicaciones', publicacionesRouter);
app.use('/api/v1/serviciosproveedores', serviciosproveedoresRouter);
app.use('/api/v1/tiposserviciosproveedores', tiposserviciosproveedoresRouter);












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

// ********************************************************************************************
// ******************************************************************************************** 

// REVISADO 06 FEBRERO 2026