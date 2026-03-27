import { JWT_SECRET } from '../config/env.js';
import jwt from 'jsonwebtoken';
import Usuario from "../models/usuarios/usuarios.model.js";
import { sequelize } from '../database/mysql.js';
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';

// Inicializar el store de sesiones (debe coincidir con el usado en app.js)
const SequelizeSessionStore = SequelizeStore(session.Store);
const sessionStore = new SequelizeSessionStore({
    db: sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000
});

const autorizaAcceso = async (req, res, next) => {
    try {
        // 1. Extraer token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ success: false, message: 'No estás autorizado para acceder a esta ruta' });
        }

        // 2. Verificar firma y decodificar (sin try-catch anidado, dejamos que jwt.verify lance)
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Verificar que el token contenga sessionId
        if (!decoded.sessionId) {
            return res.status(401).json({ success: false, message: 'Token inválido: no contiene información de sesión' });
        }

        // 4. Consultar la sesión en la base de datos (convertir callback a promesa)
        const sessionData = await new Promise((resolve, reject) => {
            sessionStore.get(decoded.sessionId, (err, session) => {
                if (err) reject(err);
                else resolve(session);
            });
        });

        if (!sessionData) {
            return res.status(401).json({ success: false, message: 'Sesión expirada o inválida. Por favor, inicia sesión nuevamente.' });
        }

        // 5. Buscar al usuario (usando id_usuario del token)
        const user = await Usuario.findOne({ where: { id_usuario: decoded.id_usuario } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'El usuario asociado al token no existe' });
        }

        // 6. Adjuntar datos al request
        req.user = user;
        req.sessionId = decoded.sessionId;

        next();

    } catch (error) {
        // Manejar errores de JWT y otros de forma centralizada
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expirado' });
        }
        // Si es otro error, pasamos al middleware de errores global
        next(error);
    }
};

export default autorizaAcceso;