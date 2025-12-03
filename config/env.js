// import { config } from 'dotenv';
// config({path: `.env.${process.env.NODE_ENV || 'development'}.local`});
// export const { 
//     PORT, 
//     NODE_ENV, 
//     HOST, 
//     USER, 
//     PASSWORD, 
//     DATABASE,
//     JWT_SECRET, 
//     JWT_EXPIRES_IN,
//     SESSION_SECRET,
//     CORS_ALLOW
//  } = process.env;

import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

// Validar que las variables críticas existan
//const requiredVars = ['DATABASE', 'USER', 'PASSWORD', 'HOST', 'JWT_SECRET', 'SESSION_SECRET'];

// Variables requeridas según el entorno
const baseRequired = ['DATABASE', 'USER', 'HOST', 'JWT_SECRET', 'SESSION_SECRET'];
const productionRequired = ['PORT', 'NODE_ENV'];
const requiredVars = process.env.NODE_ENV === 'production' 
    ? [...baseRequired, ...productionRequired] 
    : baseRequired;

const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error(`❌ Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
}

export const PORT = process.env.PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HOST = process.env.HOST || 'localhost';
export const USER = process.env.USER;
export const PASSWORD = process.env.PASSWORD || null;
export const DATABASE = process.env.DATABASE;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const CORS_ALLOW = process.env.CORS_ALLOW || 'http://localhost:5500';



export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
export const SMTP_PORT = process.env.SMTP_PORT || 587;
export const SMTP_USER = process.env.SMTP_USER || 'your_smtp_user';
export const SMTP_PASS = process.env.SMTP_PASS || 'your_smtp_password';
export const SMTP_FROM = process.env.SMTP_FROM || 'Amigo App';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'L6PdM@example.com';




// Validaciones específicas del entorno
if (NODE_ENV === 'development') {
    console.log(`✅ Configuración cargada: ${NODE_ENV}`);
    console.log(`📊 Base de datos: ${DATABASE}`);
    console.log(`🌐 Host: ${HOST}:${PORT}`);
} else if (NODE_ENV === 'production') {
    // Validaciones de producción
    console.log(`🚀 Ejecutando en PRODUCCIÓN`);
    
    // Verificar que CORS_ALLOW esté configurado correctamente
    if (!CORS_ALLOW || CORS_ALLOW.includes('localhost')) {
        console.warn(`⚠️  CORS_ALLOW contiene localhost. Verifica la configuración en producción.`);
    }
    
    // Verificar que PASSWORD no esté vacío en producción
    if (!PASSWORD || PASSWORD.trim() === '') {
        console.error(`❌ PASSWORD es obligatorio en producción`);
        process.exit(1);
    }
    
    // Verificar que NODE_ENV sea exactamente 'production'
    if (NODE_ENV !== 'production') {
        console.error(`❌ NODE_ENV debe ser 'production', actual: ${NODE_ENV}`);
        process.exit(1);
    }
    
    // Verificar secretos seguros (al menos 32 caracteres)
    if (JWT_SECRET.length < 32) {
        console.error(`❌ JWT_SECRET debe tener al menos 32 caracteres en producción`);
        process.exit(1);
    }
    
    if (SESSION_SECRET.length < 32) {
        console.error(`❌ SESSION_SECRET debe tener al menos 32 caracteres en producción`);
        process.exit(1);
    }
    
    console.log(`✅ Validaciones de producción completadas`);
    console.log(`📊 Base de datos: ${DATABASE}`);
    console.log(`🌐 Puerto: ${PORT}`);
    console.log(`🔐 Secretos configurados correctamente`);
}