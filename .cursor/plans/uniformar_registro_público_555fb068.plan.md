---
name: Uniformar registro público
overview: Refactorizaré registro público para que siga el mismo patrón de programación del CRUD de estados (validación explícita, transacción y manejo homogéneo de errores en controller), eliminando el middleware y el service compartido, y reemplazando su uso en los controllers que hoy dependen de él.
todos:
  - id: refactor-registropublico-route-controller
    content: Quitar middleware de registropublico.routes y dejar registropublico.controller autocontenido con validación+transacción+errores uniformes
    status: completed
  - id: decouple-auth-usuarios-from-service
    content: Reemplazar en auth.controller y usuarios.controller la dependencia de usuario-alta.service por lógica local equivalente
    status: completed
  - id: remove-obsolete-files
    content: Eliminar middleware/registropublico.middleware.js y services/usuario-alta.service.js tras retirar imports
    status: completed
  - id: validate-no-regressions
    content: Verificar imports residuales, probar endpoints de alta y revisar lints en archivos tocados
    status: completed
isProject: false
---

# Plan de refactor uniforme para registro público

## Objetivo
Homologar la lógica de `registropublico` al estilo del CRUD de `estados` (controlador autocontenido, validaciones claras, transacciones y respuestas uniformes), eliminando piezas intermedias no necesarias y manteniendo el comportamiento funcional de registro.

## Alcance de archivos a tocar
- [c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/routes/usuarios/registropublico.routes.js](c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/routes/usuarios/registropublico.routes.js)
- [c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/controllers/usuarios/registropublico.controller.js](c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/controllers/usuarios/registropublico.controller.js)
- [c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/controllers/login/auth.controller.js](c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/controllers/login/auth.controller.js)
- [c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/controllers/usuarios/usuarios.controller.js](c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/controllers/usuarios/usuarios.controller.js)
- [c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/middleware/registropublico.middleware.js](c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/middleware/registropublico.middleware.js)
- [c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/services/usuario-alta.service.js](c:/Users/cesar/Documents/Web/amigo-app/amigo-app-backend/services/usuario-alta.service.js)

## Cambios propuestos
- En `registropublico.routes.js`, quitar `validarRegistroPublico` y dejar solo el flujo `POST /` -> controller, como en rutas tipo `estados` (sin capa de middleware específico por endpoint).
- En `registropublico.controller.js`, mover la lógica completa de alta para que quede autocontenida:
  - construcción segura de payload (lista blanca),
  - normalización de email,
  - validación de campos obligatorios y formatos,
  - generación/hash de código,
  - validación de duplicados (email/teléfono) dentro de transacción,
  - creación de usuario y respuesta `201`,
  - mapeo de errores (`400`/`409`) y `next(error)` para no controlados.
- En `auth.controller.js` y `usuarios.controller.js`, reemplazar el uso de `persistirNuevoUsuarioConCodigo` por lógica local equivalente en sus handlers de registro (`registrar` y `usuarioPost`) para evitar dependencia del service eliminado.
- Eliminar `middleware/registropublico.middleware.js` y `services/usuario-alta.service.js` una vez removidos todos sus imports.

## Criterios de uniformidad a conservar (patrón estilo estados)
- Validaciones al inicio del handler y respuestas tempranas con `400`.
- Operaciones de escritura con `sequelize.transaction(...)`.
- Detección de conflicto de unicidad con `409`.
- Estructura consistente de respuesta JSON (`success`, `message`, `data`).
- Logging en `catch` y delegación de error no controlado.

## Verificación
- Buscar imports residuales de `registropublico.middleware.js` y `usuario-alta.service.js` (deben quedar en cero).
- Probar `POST /api/v1/registropublico` con casos:
  - payload válido -> `201`,
  - faltantes/formato inválido -> `400`,
  - email/teléfono duplicados -> `409`.
- Probar `POST /api/v1/auth/registrar` y `POST /api/v1/usuarios` para confirmar que siguen operando sin regresión tras retirar el service.
- Ejecutar revisión de lints en archivos modificados y corregir cualquier error introducido.