// cors.config.js
import cors from "cors";
import { CORS_ALLOW } from "../config/env.js";

/**
 * CORS 100% funcional para Node + Express + Cookies + Sesiones
 */

const normalizeOrigin = (value) => {
    const s = String(value || '').trim();
    if (!s) return s;
    return s.replace(/\/+$/, '');
};

export const corsMiddleware = () => {
    // Orígenes base permitidos (producción + desarrollo temporal).
    // Nota: localhost se mantendrá solo durante desarrollo.
    const baseAllowedOrigins = [
        "https://amigo.dextrati.cloud",
        "http://localhost:8081",
        "http://127.0.0.1:8081"
    ];

    // Convertir CORS_ALLOW en array limpio (sin barra final: coincide con el header Origin del navegador)
    const envWhitelist = (CORS_ALLOW || '')
        .split(',')
        .map((o) => normalizeOrigin(o))
        .filter(Boolean);
    const whitelist = [...new Set([...baseAllowedOrigins.map(normalizeOrigin), ...envWhitelist])];
    const localDevOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

    const options = {
        origin: (origin, callback) => {

            // Permitir peticiones sin "origin" (Postman, curl, same-origin)
            if (!origin) return callback(null, true);

            // Validar origen en lista permitida
            if (
                whitelist.includes(normalizeOrigin(origin)) ||
                localDevOriginRegex.test(normalizeOrigin(origin))
            ) {
                return callback(null, true);
            }

            return callback(new Error(`CORS: Origin no permitido: ${origin}`), false);
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
