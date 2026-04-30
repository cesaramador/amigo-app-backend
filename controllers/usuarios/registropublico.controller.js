import Usuario from "../../models/usuarios/usuarios.model.js";
import { sequelize } from '../../database/mysql.js';
import bcrypt from 'bcryptjs';
import { generarCodigoAccesoPlain, sendVerificationEmail } from '../../helpers/codigo-acceso-email.js';
import {
    buildPayload
} from '../../helpers/usuario-registro-payload.js';
import { PUBLIC_ALLOWED_WRITE_FIELDS } from '../../middleware/usuarios/registropublico.validator.js';

// POST /api/v1/registro-publico
// Registro de usuario para el público (sin autorizaAcceso).
export const registroPublicoPost = async (req, res, next) => {
    try {
        let payload;
        try {
            payload = buildPayload(req.body, PUBLIC_ALLOWED_WRITE_FIELDS);
        } catch (e) {
            const code = e.statusCode || 400;
            return res.status(code).json({ success: false, message: e.message || 'Solicitud inválida.' });
        }

        if (payload.email !== undefined && payload.email !== null) {
            payload.email = String(payload.email).trim().toLowerCase();
        }

        const codigoPlain = generarCodigoAccesoPlain();
        const codigoHash = await bcrypt.hash(codigoPlain, 10);

        const data = {
            ...payload,
            id_tipousuario: 3,
            id_estatus_usuario: 3,
            codigo: codigoHash,
            fecha_registro: new Date()
        };

        const nuevoUsuario = await sequelize.transaction(async (t) => {
            if (data.email) {
                const existsEmail = await Usuario.findOne({
                    where: { email: data.email },
                    transaction: t
                });
                if (existsEmail) {
                    const err = new Error('El email ya está registrado.');
                    err.statusCode = 409;
                    err.field = 'email';
                    throw err;
                }
            }
            if (data.telefono_personal) {
                const existsTel = await Usuario.findOne({
                    where: { telefono_personal: data.telefono_personal },
                    transaction: t
                });
                if (existsTel) {
                    const err = new Error('El teléfono personal ya está registrado.');
                    err.statusCode = 409;
                    err.field = 'telefono_personal';
                    throw err;
                }
            }
            return await Usuario.create(data, { transaction: t });
        });

        sendVerificationEmail(data.email, data.nombre, codigoPlain);

        const userSafe = nuevoUsuario.get({ plain: true });
        delete userSafe.codigo;

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Se ha enviado un código de verificación por email.',
            data: { user: userSafe }
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message, field: error.field });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Error en registroPublicoPost:', error.message || error);
        return next(error);
    }
};
