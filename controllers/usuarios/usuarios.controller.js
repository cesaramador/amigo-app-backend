import Usuario from "../../models/usuarios/usuarios.model.js";
import { Op } from 'sequelize';
import { sequelize } from '../../database/mysql.js';
import { SMTP_HOST, SMTP_USER, SMTP_PASS } from '../../config/env.js';
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
// import { JWT_EXPIRES_IN, JWT_SECRET } from '../../config/env.js';
// import jwt from "jsonwebtoken";

export const usuariosGet = async (req, res, next) => {
    try {
        // Paginación y orden
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Búsqueda y filtros
        const q = (req.query.q || '').trim();
        const filters = {};
        // permitir filtros simples por id_genero, id_estatus_usuario, id_tipousuario, etc.
        ['id_genero','id_estatus_usuario','id_tipousuario','id_estado','id_municipio'].forEach(key => {
            if (req.query[key] !== undefined) {
                const v = Number(req.query[key]);
                if (!Number.isNaN(v)) filters[key] = v;
            }
        });

        // Construir where con búsqueda por texto
        const where = { ...filters };
        if (q) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${q}%` } },
                { ap_paterno: { [Op.like]: `%${q}%` } },
                { ap_materno: { [Op.like]: `%${q}%` } },
                { email: { [Op.like]: `%${q}%` } },
                { telefono_personal: { [Op.like]: `%${q}%` } }
            ];
        }

        // Orden seguro: validar campos permitidos
        const [sortField = 'id_usuario', sortOrderRaw = 'asc'] = (req.query.sort || 'id_usuario:asc').split(':');
        const allowedSortFields = ['id_usuario','nombre','fecha_registro','id_tipousuario'];
        const sortFieldSafe = allowedSortFields.includes(sortField) ? sortField : 'id_usuario';
        const sortOrder = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        // Ejecutar consulta con transacción (paginada), excluir codigo
        const usuarios = await sequelize.transaction(async (t) => {
            return await Usuario.findAndCountAll({
                where,
                attributes: { exclude: ['codigo'] },
                limit,
                offset,
                order: [[sortFieldSafe, sortOrder]],
                transaction: t
            });
        });

        const total = usuarios.count;
        const pages = Math.ceil(total / limit) || 1;

        return res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos exitosamente',
            meta: {
                total,
                page,
                pages,
                limit,
                sort: `${sortFieldSafe}:${sortOrder}`
            },
            data: usuarios.rows
        });
    } catch (error) {
        console.error('Error en usuariosGet:', error.message || error);
        return next(error);
    }
}

export const usuarioGetById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        // Excluir campos sensibles como codigo
        // const usuario = await Usuario.findByPk(id, {
        //     attributes: { exclude: ['codigo'] }
        // });
        // if (!usuario) {
        //     return res.status(404).json({ message: 'Usuario no encontrado' });
        // }
        // return res.status(200).json(usuario);

        // Buscar usuario con transacción (opcional pero recomendado para consistencia)
        const usuario = await sequelize.transaction(async (t) => {
            return await Usuario.findByPk(id, {
                attributes: { exclude: ['codigo'] },
                transaction: t
            });
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario obtenido exitosamente',
            data: usuario
        });

    } catch (error) {
        console.error('Error en usuariosGetById:', error.message || error);
        return next(error);
    }
};

export const usuarioPost = async (req, res) => {
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
        // const token_init = { id: payload.telefono_personal };
        // const token = jwt.sign(token_init, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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
                // token,
                // valorCookie,
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

export const usuarioPut = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Construir lista blanca desde el modelo (excluir PK y campos inmutables)
        const attrs = Usuario.rawAttributes || {};
        const allowed = Object.keys(attrs).filter(k => !attrs[k].primaryKey && k !== 'fecha_registro');

        // Crear payload seguro
        const payload = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                const val = req.body[key];
                if (val !== null && typeof val === 'object') {
                    return res.status(400).json({ message: `Campo malformado: ${key}` });
                }
                payload[key] = val;
            }
        }
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
        }

        // Validaciones simples: longitudes y formato de email/telefono (extraer longitudes del modelo si existen)
        const maxLengths = {};
        // for (const [name, meta] of Object.entries(attrs)) {
        //     const len = meta.type?.options?.length ?? meta.type?._length;
        //     if (len) maxLengths[name] = len;
        // }
        if (payload.email) {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(String(payload.email))) {
                return res.status(400).json({ message: 'Email con formato inválido' });
            }
        }
        if (payload.telefono_personal) {
            const tel = String(payload.telefono_personal);
            if (!/^[\d+\-\s()]+$/.test(tel) || tel.length > (maxLengths.telefono_personal ?? 10)) {
                return res.status(400).json({ message: 'Teléfono con formato inválido o demasiado largo' });
            }
        }
        // verificar longitudes generales
        // const tooLong = Object.entries(maxLengths).find(([k, len]) => payload[k] && String(payload[k]).length > len);
        // if (tooLong) {
        //     return res.status(400).json({ message: `Campo demasiado largo: ${tooLong[0]} (máx ${tooLong[1]})` });
        // }

        // Comprobar unicidad (si cambian email/telefono_personal/rfc)
        const uniqueChecks = ['email', 'telefono_personal'];
        const conflicts = [];
        for (const field of uniqueChecks) {
            if (payload[field]) {
                const exists = await Usuario.findOne({
                    where: { [field]: payload[field], id_usuario: { [Op.ne]: id } }
                });
                if (exists) conflicts.push(field);
            }
        }
        if (conflicts.length) return res.status(409).json({ message: 'Valores duplicados', fields: conflicts });

        // Opcional: hashear codigo si se actualiza (requiere bcrypt instalado)
        if (payload.codigo) {
            // const bcrypt = await import('bcrypt'); // usar si se quiere dinámico
            // payload.codigo = await bcrypt.hash(payload.codigo, 10);
            // Si no desea hashear aquí, deje el comentario y maneje en capa adecuada.
        }

        // Actualizar en transacción y devolver usuario sin codigo
        const result = await sequelize.transaction(async (t) => {
            await usuario.update(payload, { transaction: t });
            return await Usuario.findByPk(id, { attributes: { exclude: ['codigo'] }, transaction: t });
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error en usuariosPut:', error.message || error);
        return next(error);
    }
}


export const usuarioPatch = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Construir lista blanca desde el modelo (excluir PK y campos inmutables)
        const attrs = Usuario.rawAttributes || {};
        const allowed = Object.keys(attrs).filter(k => !attrs[k].primaryKey && k !== 'fecha_registro');

        // Construir payload seguro (ignore campos no permitidos)
        const payload = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                const val = req.body[key];
                if (val !== null && typeof val === 'object') {
                    return res.status(400).json({ message: `Campo malformado: ${key}` });
                }
                payload[key] = val;
            }
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
        }

        // Extraer longitudes (si existen) para validar
        const maxLengths = {};
        for (const [name, meta] of Object.entries(attrs)) {
            const len = meta.type?.options?.length ?? meta.type?._length;
            if (len) maxLengths[name] = len;
        }

        // Validaciones específicas
        if (payload.email) {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(String(payload.email))) {
                return res.status(400).json({ message: 'Email con formato inválido' });
            }
        }
        if (payload.telefono_personal) {
            const tel = String(payload.telefono_personal);
            if (!/^[\d+\-\s()]+$/.test(tel) || tel.length > (maxLengths.telefono_personal ?? 20)) {
                return res.status(400).json({ message: 'Teléfono con formato inválido o demasiado largo' });
            }
        }
        // validar longitudes generales
        // const tooLong = Object.entries(maxLengths).find(([k, len]) => payload[k] && String(payload[k]).length > len);
        // if (tooLong) {
        //     return res.status(400).json({ message: `Campo demasiado largo: ${tooLong[0]} (máx ${tooLong[1]})` });
        // }

        // Comprobar unicidad (si cambian email/telefono_personal/rfc)
        const uniqueChecks = ['email', 'telefono_personal'];
        const conflicts = [];
        for (const field of uniqueChecks) {
            if (payload[field]) {
                const exists = await Usuario.findOne({
                    where: { [field]: payload[field], id_usuario: { [Op.ne]: id } }
                });
                if (exists) conflicts.push(field);
            }
        }
        if (conflicts.length) return res.status(409).json({ message: 'Valores duplicados', fields: conflicts });

        // Opcional: hashear codigo si se actualiza (descomentar si se usa bcrypt)
        if (payload.codigo) {
            // const bcrypt = await import('bcrypt');
            // payload.codigo = await bcrypt.hash(payload.codigo, 10);
        }

        // Actualizar en transacción y devolver usuario sin codigo
        const result = await sequelize.transaction(async (t) => {
            await usuario.update(payload, { transaction: t });
            return await Usuario.findByPk(id, { attributes: { exclude: ['codigo'] }, transaction: t });
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error en usuariosPatch:', error.message || error);
        return next(error);
    }
}


export const usuarioDelete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Guardar datos para respuesta (sin codigo)
        const usuarioBefore = usuario.get({ plain: true });
        delete usuarioBefore.codigo;

        // Eliminar dentro de transacción (soporta modelos paranoid -> soft delete)
        await sequelize.transaction(async (t) => {
            await usuario.destroy({ transaction: t });
        });

        // Responder con el registro eliminado (o 204 si prefieres sin body)
        return res.status(200).json({ message: 'Usuario eliminado', data: usuarioBefore });
    } catch (error) {
        console.error('Error en usuariosDelete:', error.message || error);

        // Manejo específico de FK constraint
        if (error.name === 'SequelizeForeignKeyConstraintError' || /FOREIGN KEY|REFERENCES/.test(error.message || '')) {
            return res.status(409).json({ message: 'No se puede eliminar el usuario: existen referencias en otras tablas' });
        }

        return next(error);
    }
}



