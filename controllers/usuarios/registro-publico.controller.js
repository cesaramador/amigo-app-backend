import { persistirNuevoUsuarioConCodigo } from '../../services/usuario-alta.service.js';

// POST /api/v1/registro-publico
// Registro de usuario para el público (sin autorizaAcceso).
export const registroPublicoPost = async (req, res, next) => {
    try {
        const { userSafe } = await persistirNuevoUsuarioConCodigo(req.registroPublicoPayload);
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
