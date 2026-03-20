// middleware/error.middleware.js

/**
 * Middleware Global de Manejo de Errores
 * Captura todos los errores que surgen en la aplicación,
 * incluidos errores en rutas, controladores, base de datos,
 * validaciones, JWT, etc.
 */

import { NODE_ENV } from "../config/env.js";

export const errorMiddleware = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error("🔥 Error capturado por middleware:", err);

    // Estructura base del error
    let statusCode = err.statusCode || 500;
    let message = err.message || "Error interno del servidor";

    // -------------------------
    // ERRORES DE SEQUELIZE
    // -------------------------

    // Error de validación (campos requeridos, formato inválido, etc.)
    if (err.name === "SequelizeValidationError") {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(", ");
    }

    // Error por clave duplicada
    if (err.name === "SequelizeUniqueConstraintError") {
        statusCode = 409;
        message = `Valor duplicado en: ${err.errors.map(e => e.path).join(", ")}`;
    }

    // Error por FK (relaciones inválidas)
    if (err.name === "SequelizeForeignKeyConstraintError") {
        statusCode = 400;
        message = `Violación de llave foránea en el campo: ${err.index}`;
    }

    // Error general de BD
    if (err.name === "SequelizeDatabaseError") {
        statusCode = 400;
        message = err.original?.sqlMessage || "Error en la base de datos";
    }

    // -------------------------
    // ERRORES DE MYSQL NATIVOS
    // -------------------------

    if (err.code === "ER_DUP_ENTRY") {
        statusCode = 409;
        message = `Clave duplicada: ${err.sqlMessage?.match(/'.*?'/)?.[0] || ""}`;
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        statusCode = 400;
        message = "Referencia inválida. El registro relacionado no existe.";
    }

    // -------------------------
    // ERRORES DE JWT
    // -------------------------

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Token inválido";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expirado";
    }

    // -------------------------
    // RESPUESTA ESTÁNDAR
    // -------------------------

    return res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        path: req.originalUrl,
        // Mostrar stack SOLO en desarrollo
        ...(NODE_ENV === "development" && { stack: err.stack })
    });
};
