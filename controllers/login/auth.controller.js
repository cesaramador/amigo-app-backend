import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import Usuario from '../../models/usuarios/usuarios.model.js';
import Matrizacceso from '../../models/matriz/matrizacceso.model.js';
import { sequelize } from '../../database/mysql.js';
import { JWT_EXPIRES_IN, JWT_SECRET, SMTP_HOST, SMTP_USER, SMTP_PASS } from '../../config/env.js';
import Municipios from "../../models/usuarios/municipios.model.js";

// funcion para registro de usuarios
export const registrar = async (req, res) => {
    try {
        console.log('Body recibido:', JSON.stringify(req.body)); // ver payload limpio

        // Lista blanca de campos permitidos (ajusta según tu esquema)
        const allowed = [
            'id_tipousuario','nombre','ap_paterno','ap_materno','fecha_nacimiento',
            'telefono_personal','telefono_contacto','email','codigo',
            'id_estado','id_municipio','colonia','calle','numero_int','numero_ext',
            'codigo_postal','razon_social','rfc','fecha_registro','id_genero',
            'id_estatus_usuario','id_estatus_marital','id_categoria_vivienda'
        ];

        // Construir payload sólo con campos permitidos y convertir tipos simples
        const payload = {};

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                const val = req.body[key];
                // evita insertar objetos completos (solo primitivos o null)
                if (val !== null && typeof val === 'object') {
                    // opcional: saltar o transformarlo; aquí lanzamos para detectar el campo
                    throw new TypeError(`Campo no permitido o malformado: ${key}`);
                }
                payload[key] = val;
            }
        }

        // Extraer restricciones desde el modelo
        const attrs = Usuario.rawAttributes || {};
        const requiredFields = [];
        const maxLengths = {};
        for (const [name, meta] of Object.entries(attrs)) {
            if (meta.allowNull === false && !meta.primaryKey && typeof meta.defaultValue === 'undefined') {
                requiredFields.push(name);
            }
            // detectar longitud si fue definida como DataTypes.STRING(50)
            const len = meta.type?.options?.length ?? meta.type?._length;
            if (len) maxLengths[name] = len;
        }
        
        // Validar campos obligatorios (según modelo)
        const missing = requiredFields.filter(f => {
            // ignore id auto increment
            if (attrs[f]?.primaryKey) return false;
            const v = payload[f];
            return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
        });
        if (missing.length) {
            return res.status(400).json({ message: 'Faltan campos obligatorios según el modelo', fields: missing });
        }

        // Validaciones básicas por campo
        const invalid = [];
        if (payload.email) {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(String(payload.email))) invalid.push({ field: 'email', reason: 'Formato inválido' });
        }
        if (payload.telefono_personal) {
            const tel = String(payload.telefono_personal);
            if (!/^[\d+\-\s()]+$/.test(tel) || tel.length > (maxLengths.telefono_personal ?? 10)) {
                invalid.push({ field: 'telefono_personal', reason: 'Formato inválido o demasiado largo' });
            }
        }

        if (invalid.length) {
            return res.status(409).json({ message: 'Formato inválido en Email / Telefono Personal', fields: invalid });
        }

        // Comprobar unicidad en BD (email, telefono_personal)
        const conflicts = [];
        if (payload.email) {
            const exists = await Usuario.findOne({ where: { email: payload.email } });
            if (exists) conflicts.push('email');
        }
        if (payload.telefono_personal) {
            const exists = await Usuario.findOne({ where: { telefono_personal: payload.telefono_personal } });
            if (exists) conflicts.push('telefono_personal');
        }
        if (conflicts.length) {
            return res.status(409).json({ message: 'Valores duplicados en la base de datos', fields: conflicts });
        }

        // --- GENERAR CÓDIGO DE 5 DÍGITOS Y HASHEARLO ---
        const codigoPlain = Math.floor(10000 + Math.random() * 90000).toString(); // e.g. "48291"
        const saltCodigo = await bcrypt.genSalt(10);
        const codigoHash = await bcrypt.hash(codigoPlain, saltCodigo);
        // asignar código hasheado al payload
        payload.codigo = codigoHash;

        // Enviar codigo de verificación para pruebas
        // console.log("El codigo generado es: " + codigoPlain); // Para pruebas: mostrar el código generado en consola

        // Asignar fecha de registro actual si no se proporcionó
        payload.fecha_registro = new Date();

        // --- GUARDAR USUARIO EN LA BASE DE DATOS DENTRO DE UNA TRANSACCIÓN ---
        // Si no lanzas error → Sequelize hace commit automático.
        // Si lanzas un error → Sequelize hace rollback automático.
        const nuevousuario = await sequelize.transaction(async (t) => {

            const usuario = await Usuario.create(payload, { transaction: t });

            if (!usuario.email.includes("@")) {
                throw new Error("Email inválido — se hace rollback automático");
            }

            return usuario; // commit automático
        });
        
        // --- GENERAR TOKEN JWT ---
        // "payload.telefono_personal" es obtenido del formulario llenado por el usuario 
        // y se usa para crear el token e identificar al usuario
        const token_init = { id: payload.telefono_personal };
        const token = jwt.sign(token_init, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Excluir codigo de la respuesta
        // const response = nuevousuario.get({ plain: true });
        // delete response.codigo;

        const userSafe = { ...nuevousuario.get() };
        delete userSafe.codigo;

        // --- ENVIAR CORREO CON EL CÓDIGO ORIGINAL ---
        // debe configurarse el password de gmail para apps menos seguras o usar OAuth2, sino no funcionará
        // https://support.google.com/mail/answer/185833?hl=es-419
        // Crea y administra las contraseñas de aplicaciones
        // https://myaccount.google.com/apppasswords
        
        // visualizar configuración SMTP
        // console.log("Host: ", SMTP_HOST, "Pass ", SMTP_PASS, "User: ", SMTP_USER);
        
        (async () => {
            try {
                const transporter = nodemailer.createTransport({
                    service: SMTP_HOST,
                    auth: { user: SMTP_USER, pass: SMTP_PASS }
                });

                // Enviar correo
                await transporter.sendMail({
                    from: SMTP_USER,
                    to: payload.email,
                    subject: "Código de acceso inicial App Amigo",
                    html: `
                        <p>Hola ${payload.nombre},</p>
                        <p>Tu código para tu acceso es:</p>
                        <h2>${codigoPlain}</h2>
                        <p>Este código solo será necesario en tu primer inicio de sesión.</p>
                    `
                });

            } catch (e) {
                console.warn("No se pudo enviar el correo:", e.message);
            }
        })();

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Se ha enviado un código de verificación por email.',
            data: {
                token,
                codigoHash,
                codigoPlain,
                user: userSafe
            }
        });

    } catch (error) {
        console.error("Error en registrarUsuario:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno en registro."
        });
    }
};

export const iniciar = async (req, res) => {
    try {

        // el primer login se solicita el número_personal y el código
        // despues del primer login ya no se muestra la vista de solicitud de telefono_personal y código
        // por lo tanto debe de leerse primero la cookie 
        // si la cookie tiene "false" -> se pide el telefono_personal y el código
        // si la cookie tiene "true" -> no se muestra la vista de login

        // si hay un login correcto entonces
        // leer la matriz de acceso para ver permisos a las vistas del sistema

        const { telefono_personal, codigo } = req.body;

        console.log(telefono_personal);
        console.log(codigo);
        //console.log(token);

        // Buscar usuario por telefono_personal
        const user = await Usuario.findOne({ where: { telefono_personal } });
        if (!user) {
            return res.status(400).json({ success: false, message: "Usuario no encontrado" });
        }

        // comparar el código recibido con el codigo guardado en BD
        const codigoValido = await bcrypt.compare(codigo, user.codigo);
   
        if (!codigoValido) {
            return res.status(400).json({ success: false, message: "Código de acceso incorrecto" });
        } 

        // --- GENERAR TOKEN JWT ---
        // "user.telefono_personal" es obtenido de la base de datos con la funcion fidOne
        // y se usa para crea el token e identificar al usuario
        const token_init = { id: user.telefono_personal };
        const token = jwt.sign(token_init, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Remover datos sensibles antes de responder
        const userSafe = { ...user.get() };
        delete userSafe.codigo;

        // --- GUARDAR EL ESTATUS (TRUE/FALSE) EN UNA COOKIE PARA EL PRIMER ACCESO ---
        // Name = valor, Value (init_value = true)
        let init_value = 'true';
        res.cookie("valor", init_value, {
            httpOnly: true, // no accesible desde JavaScript del cliente
            secure: false, // cambiar a true en producción con HTTPS
            sameSite: "lax", // proteger contra CSRF (Strict, Lax, None) Dominios distintos
            maxAge: 300000 // 5 minutos
        });

        // const valorCookie = req.cookies; // obtener todas las cookies como un objeto
 
        // crear la session de usuario
        // la sesion dura 1 minuto solamente, para modificar ir a la inicialización dentro de app.js 
        req.session.amigo= req.sessionID;
        const idSession = req.session.amigo || 'No session set';
        req.session.usuario = user.telefono_personal;
        const userSession = req.session.usuario || 'No session set';
        
        //res.send(`Welcome ${userTest} to my API Server is running on http://localhost:${ PORT } and ID ${ idSession }`);

        // obtener los valores de la matriz de acceso para el usuario
        // y enviarlos al frontend para mostrar/ocultar vistas según permisos
        const matrizacceso = await Matrizacceso.findAll({ where: { id_tipousuario: user.id_tipousuario } });

        if (!matrizacceso) {
            return res.status(400).json({ success: false, message: "Matriz de acceso no encontrada" });
        }

        return res.status(200).json({
            // inicio exitoso abrir dashboard
            success: true,
            message: "Inicio de sesión exitoso",
            token,
            idSession,
            userSession,
            matrizacceso,
            user: userSafe
        });


    } catch (error) {
        console.error("Error en iniciar sesión:", error);
        return res.status(500).json({ success: false, message: "Error interno" });
    }
};


export const abandonar = async (req, res) => {
    try {

        console.log("Solicitud para cerrar sesión recibida.");

        // --- 1. ELIMINAR COOKIE DE PRIMER ACCESO ---
        // Esta cookie se crea en iniciar(), por lo tanto debe eliminarse al salir.
        res.clearCookie("valor", {
            httpOnly: true,
            secure: false,   // true si está en producción con HTTPS
            sameSite: "lax"
        });

        // --- 2. INVALIDAR SESIÓN ---
        if (req.session) {

            console.log("Sesión actual:", req.session);

            // destruir la sesión
            req.session.destroy((err) => {

                if (err) {
                    console.error("Error al destruir sesión:", err);
                    return res.status(500).json({
                        success: false,
                        message: "No se pudo cerrar la sesión correctamente."
                    });
                }

                // también eliminar cookie de la sesión generada por express-session
                res.clearCookie("connect.sid", {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax"
                });

                console.log("Sesión eliminada correctamente.");

                return res.status(200).json({
                    success: true,
                    message: "Sesión cerrada correctamente."
                });
            });

        } else {
            // si no existía sesión igual devolvemos estado consistente
            return res.status(200).json({
                success: true,
                message: "No había sesión activa, pero el cierre se procesó correctamente."
            });
        }

    } catch (error) {
        console.error("Error en abandonar():", error);
        return res.status(500).json({
            success: false,
            message: "Error interno al cerrar sesión."
        });
    }
};


// funcion para cargar datos en el formulario de registro
export const obtenerMunicipiosPorEstado = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id_estado } = req.params;

        if (!id_estado) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Debe proporcionar un id_estado"
            });
        }

        // Buscar municipios dentro de una transacción
        const municipios = await Municipios.findAll({
            where: { id_estado },
            attributes: ["num_municipio", "municipio"],
            transaction: t
        });

        const total = municipios.length;

        // Confirmar transacción
        await t.commit();

        return res.status(200).json({
            success: true,
            message: "Municipios encontrados",
            total_registros: total,
            municipios
        });

    } catch (error) {
        console.error("Error al obtener municipios:", error);
        await t.rollback();

        return res.status(500).json({
            success: false,
            message: "Error interno al consultar municipios"
        });
    }
};

