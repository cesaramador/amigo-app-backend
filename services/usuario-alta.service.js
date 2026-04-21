import Usuario from '../models/usuarios/usuarios.model.js';
import { sequelize } from '../database/mysql.js';
import bcrypt from 'bcryptjs';
import { generarCodigoAccesoPlain, sendVerificationEmail } from '../helpers/codigo-acceso-email.js';

/**
 * Crea un usuario con código de acceso (hash en BD, plano por correo).
 * Espera un payload ya validado (campos obligatorios y formatos).
 */
export async function persistirNuevoUsuarioConCodigo(payload) {
    const codigoPlain = generarCodigoAccesoPlain();
    const codigoHash = await bcrypt.hash(codigoPlain, 10);

    const data = {
        ...payload,
        codigo: codigoHash,
        fecha_registro: new Date()
    };

    const nuevousuario = await sequelize.transaction(async (t) => {
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

    const userSafe = nuevousuario.get({ plain: true });
    delete userSafe.codigo;
    return { userSafe };
}
