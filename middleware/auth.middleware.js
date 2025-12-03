import { JWT_SECRET } from '../config/env.js';
import jwt from 'jsonwebtoken';
import Usuario from "../models/usuarios/usuarios.model.js";

// middleware para autorizar rutas protegidas
// verificar el token del usuario autenticado en el request 
// y compararlo con el token del usuario en la base de datos
// si es válido, permitir el acceso a la ruta protegida 
const autorizaAcceso = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'No estas autorizado para acceder a esta ruta' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await Usuario.findOne({ where: { telefono_personal: decoded.id } });

        if (!user) {
            return res.status(401).json({ message: 'El usuario asociado al token no existe' });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({ message: 'Sin autorización', error: error.message || error });
    }
}

export default autorizaAcceso;
