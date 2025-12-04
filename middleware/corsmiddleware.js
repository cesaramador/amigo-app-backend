// cors.config.js
import cors from "cors";
import { CORS_ALLOW } from "../config/env.js";

/**
 * CORS 100% funcional para Node + Express + Cookies + Sesiones
 */

export const corsMiddleware = () => {
    
    // Convertir CORS_ALLOW en array limpio
    const whitelist = (CORS_ALLOW || "http://localhost:5500")
        .split(",")
        .map(o => o.trim());

    const options = {
        origin: (origin, callback) => {

            // Permitir peticiones sin "origin" (Postman, curl, same-origin)
            if (!origin) return callback(null, true);

            // Validar origen en lista permitida
            if (whitelist.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`🚫 CORS: Origin no permitido: ${origin}`), false);
        },

        credentials: true,   // Necesario para enviar cookies y sesiones
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Origin",
            "Content-Type",
            "Accept",
            "Authorization",
            "X-Requested-With"
        ],
        exposedHeaders: ["Content-Range", "X-Total-Count"],

        preflightContinue: false,
        optionsSuccessStatus: 200  // El valor correcto para navegadores antiguos
    };

    return cors(options);
};
