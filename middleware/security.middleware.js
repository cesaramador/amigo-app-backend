// Middleware robusto para validación y sanitización de entradas (SQLi, XSS, Path Traversal, tamaño, profundidad, whitelist)
// Opciones:
//  - mode: 'reject' (por defecto) | 'sanitize'  -> 'reject' devuelve 400 ante entrada sospechosa, 'sanitize' intenta limpiar
//  - maxStringLength, maxKeys, maxDepth, maxBodyBytes, whitelistParams (array), allowedContentTypes (array)
//  - escapeHtmlOnSanitize: boolean (si mode === 'sanitize')
// Uso: app.use(securityMiddleware(options));
const DEFAULTS = {
  mode: 'reject',
  maxStringLength: 1000,
  maxKeys: 200,
  maxDepth: 10,
  maxBodyBytes: 1_000_000, // 1MB
  whitelistParams: null,
  allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
  escapeHtmlOnSanitize: true
};

// patrones sospechosos para SQLi / comandos peligrosos (mejor detectar múltiples patrones en combinación)
const SQLI_PATTERNS = [
  /\bunion\b\s+select\b/i,
  /\bselect\b.+\bfrom\b/i,
  /\binsert\b.+\binto\b/i,
  /\bupdate\b.+\bset\b/i,
  /\bdelete\b.+\bfrom\b/i,
  /\bdrop\b\s+\btable\b/i,
  /\btruncate\b/i,
  /('|")\s*(or|and)\s+.+=+/i,     // "' OR 1=1" style
  /--\s*$/i,                      // SQL comment at end
  /;[\s]*$/i,                     // trailing semicolon
  /\bexec\b\s+/i,
  /\bdeclare\b\s+/i,
  /\bsp_executesql\b/i,
  /0x[0-9a-f]{2,}/i,             // hex payloads
  /\bchar\(/i,
  /\bconcat\(/i,
  /\/\*.*\*\//i                   // block comments
];

// patrones XSS / javascript URIs
const XSS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
  /javascript\s*:/i,
  /\bon\w+\s*=\s*["'][^"']*["']/i, // onerror=, onclick= ...
  /<img\b[^>]+>/i,
  /<iframe\b/i,
  /<svg\b/i
];

// path traversal
const PATH_TRAVERSAL = [
  /\.\.\/|\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e%5c/i
];

// control chars / null bytes
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

// helper para escapar HTML
const escapeHtml = (str) =>
  str.replace(/[&<>"'`=\/]/g, (s) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
  }[s]));

// detección combinada
const containsPattern = (str, patterns) => {
  if (typeof str !== 'string' || str.length === 0) return false;
  for (const re of patterns) if (re.test(str)) return true;
  return false;
};

const sanitizeString = (str, opts) => {
  let out = String(str).trim();
  // eliminar control chars
  out = out.replace(CONTROL_CHARS, '');
  // opcionalmente escapar HTML para evitar XSS cuando mode === 'sanitize'
  if (opts.mode === 'sanitize' && opts.escapeHtmlOnSanitize) out = escapeHtml(out);
  // limitar longitud
  if (out.length > opts.maxStringLength) {
    if (opts.mode === 'reject') throw new Error(`String demasiado largo (máx ${opts.maxStringLength})`);
    out = out.slice(0, opts.maxStringLength);
  }
  return out;
};

const deepInspectAndSanitize = (value, opts, ctx = { depth: 0, keys: 0 }) => {
  // depth control
  if (ctx.depth > opts.maxDepth) throw new Error('Estructura demasiado profunda');
  if (value == null) return value;

  const t = typeof value;
  if (t === 'string') {
    // check patterns
    if (containsPattern(value, SQLI_PATTERNS)) {
      if (opts.mode === 'reject') throw new Error('Entrada sospechosa (SQL Injection detectado)');
      // sanitize by neutralizing quotes and keywords
      let s = value.replace(/['"]/g, '');
      s = s.replace(/\b(SELECT|INSERT|UPDATE|DELETE|UNION|DROP|TRUNCATE|DECLARE|EXEC)\b/ig, '');
      s = sanitizeString(s, opts);
      return s;
    }
    if (containsPattern(value, XSS_PATTERNS)) {
      if (opts.mode === 'reject') throw new Error('Entrada sospechosa (XSS detectado)');
      let s = value;
      if (opts.escapeHtmlOnSanitize) s = escapeHtml(s);
      s = sanitizeString(s, opts);
      return s;
    }
    if (containsPattern(value, PATH_TRAVERSAL)) {
      if (opts.mode === 'reject') throw new Error('Entrada sospechosa (Path Traversal detectado)');
      // remove ../ sequences
      return sanitizeString(value.replace(/\.\.(\/|\\)/g, ''), opts);
    }
    if (value.includes('\x00')) {
      if (opts.mode === 'reject') throw new Error('Entrada inválida (NULL byte detectado)');
      return sanitizeString(value.replace(/\x00/g, ''), opts);
    }
    // general sanitize
    return sanitizeString(value, opts);
  }

  if (t === 'number' || t === 'boolean') {
    if (Number.isFinite(value) || typeof value === 'boolean') return value;
    throw new Error('Valor numérico inválido');
  }

  if (Array.isArray(value)) {
    if (++ctx.depth > opts.maxDepth) throw new Error('Estructura de array demasiado profunda');
    return value.map((v) => deepInspectAndSanitize(v, opts, { depth: ctx.depth, keys: ctx.keys }));
  }

  if (t === 'object') {
    const out = {};
    ctx.keys = ctx.keys || 0;
    for (const k of Object.keys(value)) {
      ctx.keys++;
      if (ctx.keys > opts.maxKeys) throw new Error('Demasiadas claves en el objeto');
      // disallow suspicious param names like '__proto__' or 'constructor'
      if (/^(__proto__|constructor|prototype)$/.test(k)) throw new Error('Clave no permitida en el objeto');

      // if whitelist provided, check here (only at top-level)
      if (opts.whitelistParams && ctx.depth === 0) {
        if (!opts.whitelistParams.includes(k)) {
          throw new Error(`Parámetro no permitido: ${k}`);
        }
      }

      out[k] = deepInspectAndSanitize(value[k], opts, { depth: ctx.depth + 1, keys: ctx.keys });
    }
    return out;
  }

  // fallback: return as-is
  return value;
};

export default function securityMiddleware(userOptions = {}) {
  const opts = { ...DEFAULTS, ...userOptions };

  return (req, res, next) => {
    try {
      // Content-Length / body size check
      const contentLength = Number(req.headers['content-length'] || 0);
      if (contentLength && contentLength > opts.maxBodyBytes) {
        return res.status(413).json({ success: false, message: 'Payload demasiado grande' });
      }

      // Content-Type validation (si provisto y no multipart when not allowed)
      if (req.headers['content-type'] && Array.isArray(opts.allowedContentTypes) && opts.allowedContentTypes.length) {
        const contentType = String(req.headers['content-type']).split(';')[0].trim();
        if (!opts.allowedContentTypes.includes(contentType)) {
          return res.status(415).json({ success: false, message: `Content-Type no permitido: ${contentType}` });
        }
      }

      // quick check: too many query params
      const totalQueryKeys = Object.keys(req.query || {}).length;
      if (totalQueryKeys > opts.maxKeys) {
        return res.status(400).json({ success: false, message: 'Demasiados parámetros en query' });
      }

      // sanitize params, query, body
      if (req.params) {
        req.params = deepInspectAndSanitize(req.params, opts);
      }
      if (req.query) {
        req.query = deepInspectAndSanitize(req.query, opts);
      }
      if (req.body) {
        // if raw body present as string (e.g., text), check patterns
        req.body = deepInspectAndSanitize(req.body, opts);
      }

      // Additional header checks: deny suspicious headers
      const forbiddenHeaderPatterns = [/sql/i, /mysql/i, /oracle/i, /union/i, /select/i];
      for (const h of Object.keys(req.headers || {})) {
        if (forbiddenHeaderPatterns.some(re => re.test(h))) {
          return res.status(400).json({ success: false, message: 'Header sospechoso detectado' });
        }
        const hv = String(req.headers[h] || '');
        if (containsPattern(hv, SQLI_PATTERNS) || containsPattern(hv, XSS_PATTERNS)) {
          return res.status(400).json({ success: false, message: 'Header con contenido sospechoso' });
        }
      }

      // Basic rate-protection hint: if desired, user can provide a rateCheck function via options
      if (typeof opts.rateCheck === 'function') {
        const allowed = opts.rateCheck(req);
        if (allowed === false) return res.status(429).json({ success: false, message: 'Too many requests' });
      }

      // All good
      return next();
    } catch (err) {
      // If opts.mode === 'sanitize' some sanitizations may throw; convert to 400
      console.warn('securityMiddleware blocked request:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'Entrada inválida' });
    }
  };
}