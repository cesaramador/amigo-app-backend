/**
 * Security Middleware Enterprise
 * Protección avanzada contra ataques en formularios y APIs públicas
 * Compatible con Express + Sequelize
 */

// import crypto from "crypto";

const DEFAULTS = {
  mode: "reject",
  maxStringLength: 1000,
  maxKeys: 100,
  maxDepth: 8,
  maxBodyBytes: 1_000_000,
  whitelistParams: null,
  allowedContentTypes: [
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data"
  ],
  escapeHtmlOnSanitize: true,
  maxRequestsPerMinute: 60   // 🆕 anti brute-force
};

/* ------------------ PATRONES AVANZADOS ------------------ */

const NOSQL_PATTERNS = [
  /\$ne/i, /\$gt/i, /\$lt/i, /\$or/i, /\$and/i, /\$where/i
];

const BOT_HEADERS = [
  "sqlmap", "nikto", "nmap", "acunetix", "burp", "crawler"
];

/* ------------------ RATE LIMIT SIMPLE ------------------ */

const rateStore = new Map();

const isRateLimited = (ip, limit) => {
  const now = Date.now();
  const windowMs = 60_000;

  if (!rateStore.has(ip)) {
    rateStore.set(ip, { count: 1, time: now });
    return false;
  }

  const data = rateStore.get(ip);
  if (now - data.time > windowMs) {
    rateStore.set(ip, { count: 1, time: now });
    return false;
  }

  data.count++;
  return data.count > limit;
};

/* ------------------ SANITIZACIÓN ------------------ */

const sanitizeString = (str, opts) => {
  let out = String(str).replace('/[\x00-\x1F]/g', "").trim();
  if (out.length > opts.maxStringLength) {
    if (opts.mode === "reject") throw new Error("Campo demasiado largo");
    out = out.slice(0, opts.maxStringLength);
  }
  return out;
};

const deepInspect = (obj, opts, depth = 0) => {
  if (depth > opts.maxDepth) throw new Error("Estructura demasiado profunda");

  if (typeof obj === "string") {
    if (NOSQL_PATTERNS.some(r => r.test(obj))) {
      throw new Error("NoSQL Injection detectado");
    }
    return sanitizeString(obj, opts);
  }

  if (Array.isArray(obj)) {
    return obj.map(v => deepInspect(v, opts, depth + 1));
  }

  if (typeof obj === "object" && obj !== null) {
    const result = {};
    for (const key of Object.keys(obj)) {
      if (/^(__proto__|constructor|prototype)$/.test(key)) {
        throw new Error("Clave peligrosa detectada");
      }
      if (opts.whitelistParams && depth === 0 && !opts.whitelistParams.includes(key)) {
        throw new Error(`Campo no permitido: ${key}`);
      }
      result[key] = deepInspect(obj[key], opts, depth + 1);
    }
    return result;
  }

  return obj;
};

/* ------------------ MIDDLEWARE ------------------ */

export default function securityMiddleware(userOptions = {}) {
  const opts = { ...DEFAULTS, ...userOptions };

  return (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;

      // 🛑 Rate limit
      if (isRateLimited(ip, opts.maxRequestsPerMinute)) {
        return res.status(429).json({
          success: false,
          message: "Demasiadas solicitudes. Intente más tarde."
        });
      }

      // 🛑 Bots conocidos
      const ua = (req.headers["user-agent"] || "").toLowerCase();
      if (BOT_HEADERS.some(b => ua.includes(b))) {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado"
        });
      }

      // 🛑 Body size
      const contentLength = Number(req.headers["content-length"] || 0);
      if (contentLength > opts.maxBodyBytes) {
        return res.status(413).json({ success: false, message: "Payload demasiado grande" });
      }

      // 🛑 Sanitizar inputs
      req.params = deepInspect(req.params || {}, opts);
      req.query = deepInspect(req.query || {}, opts);
      req.body = deepInspect(req.body || {}, opts);

      next();
    } catch (err) {
      console.warn("🚨 Security middleware bloqueó petición:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message || "Solicitud bloqueada por seguridad"
      });
    }
  };
}
