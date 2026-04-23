import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FROM_EMAIL } from '../config/env.js';

/** Código numérico de 6 dígitos (texto plano; en BD se guarda hash bcrypt). */
export const generarCodigoAccesoPlain = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const mailFrom = () => (FROM_EMAIL ? `"${SMTP_FROM}" <${FROM_EMAIL}>` : SMTP_USER);

const sendMailAsync = async (mailOptions) => {
    const port = Number(SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    await transporter.sendMail({ ...mailOptions, from: mailFrom() });
};

/** Registro / alta: código inicial (fire-and-forget). */
export const sendVerificationEmail = (toEmail, nombre, codigoPlain) => {
    (async () => {
        try {
            await sendMailAsync({
                to: toEmail,
                subject: 'Código de acceso inicial App Amigo',
                html: `
                    <p>Hola ${nombre},</p>
                    <p>Tu código para tu acceso es:</p>
                    <h2>${codigoPlain}</h2>
                    <p>Este código solo será necesario en tu primer inicio de sesión.</p>
                `
            });
        } catch (e) {
            console.warn(
                'No se pudo enviar el correo de verificación:',
                e.code || 'NO_CODE',
                e.message
            );
        }
    })();
};

/** Recuperación de código (fire-and-forget). */
export const sendRecoveryCodeEmail = (toEmail, nombre, codigoPlain) => {
    (async () => {
        try {
            await sendMailAsync({
                to: toEmail,
                subject: 'Recuperación de código de acceso App Amigo',
                html: `
                    <p>Hola ${nombre},</p>
                    <p>Solicitaste recuperar tu código de acceso.</p>
                    <p>Tu nuevo código es:</p>
                    <h2>${codigoPlain}</h2>
                    <p>Si no realizaste esta solicitud, contacta al administrador.</p>
                `
            });
        } catch (e) {
            console.warn(
                'No se pudo enviar el correo de recuperación:',
                e.code || 'NO_CODE',
                e.message
            );
        }
    })();
};
