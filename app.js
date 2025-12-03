// importar módulos necesarios y variables de entorno
import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';
import { CORS_ALLOW } from './config/env.js';

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
//import proveedorRouter from './routes/proveedores/proveedores.routes.js';

// import errormiddleware from './middleware/error.middleware.js';
import cookieParser from 'cookie-parser';
import session from "express-session";
import { SESSION_SECRET, NODE_ENV } from './config/env.js';

// importar SharedPreferences middleware
// import SharedPrefs from './middleware/sharedprefs.middleware.js';
// import SharedPreferences from "react-native-shared-preferences";

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
// app.use(errormiddleware);

// ********************************************************************************************
// ********************************************************************************************
// CONFIGURACIÓN DE CORS
// Colocar CORS antes de registrar rutas y antes de session middleware

const whitelist = (CORS_ALLOW || 'http://localhost:5500').split(',');
const corsOptions = {
    origin: (origin, callback) => {
        // permitir solicitudes sin Origin (Postman, same-origin, server-to-server)
        if (!origin) return callback(null, true);
        if (whitelist.includes(origin)) return callback(null, true);
        return callback(new Error('CORS policy: Origin not allowed'), false);
    },
    credentials: true,
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // manejar preflight

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
// configurar SharedPreferences
// SharedPreferences.setName("amigoAppPrefs");

// guardar SharedPreferences
// SharedPreferences.setItem("myKey", "myValue");

// obtener SharedPreferences
// const value = await SharedPreferences.getItem("myKey");
// console.log("SharedPreferences Value:", value);

// borrar SharedPreferences
// SharedPreferences.removeItem("myKey");


// Guardar valor
// await SharedPrefs.set("myKey", { logged: true, theme: "dark" });

// Obtener valor
// const prefs = await SharedPrefs.get("myKey");
// console.log("SharedPreferences Value:", prefs);

// Eliminar valor
// await SharedPrefs.remove("myKey");



// ********************************************************************************************
// ********************************************************************************************
// REGISTRO DE RUTAS
// registrar rutas DESPUÉS de la definición de la session middleware

// app.get('/', (req, res) => {
//     // set a session variable
//     req.session.amigo= req.sessionID;
//     req.session.userTest = 'cesar.amador';
//     const userTest = req.session.userTest || 'No session set';
//     const idSession = req.session.amigo || 'No session set';
//     console.log("ID de la sesión:", idSession);
//     console.log(req.session.userTest);
//     res.send(`Welcome ${userTest} to my API Server is running on http://localhost:${ PORT } and ID ${ idSession }`);
// });

// app.get('/get', (req, res) => {
//     // retrieve the session variable
//     const userTest = req.session.userTest || 'No session set';
//     res.send(`Session variable: ${userTest}`);
// });


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

// api principal para los grupos
app.use('/api/v1/grupos', grupoRouter);

// api principal para los proveedores
//app.use('/api/v1/proveedores', proveedorRouter);


// ********************************************************************************************
// ********************************************************************************************
// INICIO DEL SERVIDOR

app.listen(PORT, async () => {
    await connection();
    console.log(`Server is running on http://localhost:${ PORT }`);
});

export default app;

