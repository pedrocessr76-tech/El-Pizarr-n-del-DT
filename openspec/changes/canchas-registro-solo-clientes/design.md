## Context

El Sistema Canchas (B2B) expone hoy tres endpoints públicos de auth bajo `/api/v1/auth`: `register` (crea organización + rol `OWNER`), `register-client` (crea cuenta `CLIENT`) y `login`. El frontend `B2bLogin` muestra un selector de rol (OWNER/ADMIN/OPERATOR/CLIENT) tanto en login como en registro; al elegir un rol de staff en registro se muestra el formulario "Nueva organización". El login (`enterB2b`) ya navega según los roles reales devueltos por el backend, pero conserva un fallback basado en el rol seleccionado manualmente.

Se busca que la creación de cuentas de administrador/dueño sea exclusivamente por código (el seed `B2bSeedService` ya crea un admin con `B2B_SEED=true`, y ya existe un admin de prueba), y que la navegación post-login dependa solo del rol autenticado.

## Goals / Non-Goals

**Goals:**
- Registrar públicamente solo cuentas `CLIENT` (usuario).
- Retirar la auto-registración pública de organizaciones y roles de staff.
- Detectar el rol al iniciar sesión y rutear la navegación sin selector manual.
- Mantener intactas las funcionalidades de admin/dueño y el seed por código.

**Non-Goals:**
- No crear nuevos usuarios admin de prueba ni modificar el seed de datos.
- No cambiar el modelo de roles ni los guards de autorización del backend.
- No modificar la asignación de organización en `registerClient` (sigue eligiendo la primera organización activa).
- No cambiar el "role switch" de la barra lateral (vista interna de staff).

## Decisions

**D1. Retirar el endpoint público `POST /api/v1/auth/register`**
Se elimina la ruta en `B2bAuthController` y el método `registerOrganization` en `B2bAuthService`. Alternativa considerada: protegerlo con un guard de staff. Se descarta porque no hay caso de uso de alta dinámica de organizaciones vía UI; el seed/script es la vía única y controlable. El rol `OWNER` se asigna solo por código.

**D2. Mantener `POST /api/v1/auth/register-client` como registro único**
Es el único registro público y crea cuentas `CLIENT`. Su comportamiento de selección de organización activa no cambia.

**D3. Login rutea exclusivamente por roles autenticados**
En `B2bApp.enterB2b`, la navegación se decide por `user.roles` del JWT (`CLIENT` → `portal`; staff → `dashboard`). El estado local `role` se setea desde los roles detectados, sin depender del rol previamente seleccionado.

**D4. Eliminar el selector de rol del login/registro**
`B2bLogin` deja de recibir `role`/`onRoleChange`/`onRegister` (registro de organización). El modo registro solo presenta el formulario de cliente (nombre completo, email, contraseña, confirmación) y llama a `registerClientAccount`.

**D5. Limpiar `register` de cliente**
Se elimina el método `register` (organización) de `useB2bStore` y `b2bService`. Quedan `login`, `registerClient` y `logout`.

**D6. Actualizar `b2b-smoke-test.mjs`**
El script deja de usar `/api/v1/auth/register`. La creación de la organización de prueba pasa al seed (`B2B_SEED=true`) o se elimina esa sección, validando `register-client` y `login` para staff pre-creado por seed.

## Risks / Trade-offs

- [Si un cliente necesita alta rápida de un complejo por UI] → Mitigación: script/seed de alta por código; se documenta en operación.
- [`registerClient` elige la primera organización activa y quizá no es la deseada] → Comportamiento existente, fuera de alcance; se deja nota como mejora futura.
- [Quitar el selector de rol puede confundir a un staff que probaba vistas en el login] → Mitigación: el role switch de la barra lateral sigue disponibles tras iniciar sesión como staff.
- [Smoke test depende de datos del seed] → Mitigación: el test se ajusta para arrancar con `B2B_SEED=true` y no crear datos por API.

## Migration Plan

1. Backend: retirar ruta y método `registerOrganization`; build y typecheck.
2. Frontend: simplificar `B2bLogin` y `B2bApp`; quitar `register` de store y service; typecheck.
3. Scripts: ajustar `b2b-smoke-test.mjs`; correr tests backend.
4. Validación local (Docker): login de cliente y de admin seed; verificar que `register` devuelve 404 y que `register-client` funciona.
5. Rollback: restaurar los commits previos (los roles y guard de staff no se tocaron).

## Open Questions

Ninguna pendiente. La organización de destino de `registerClient` se mantiene como está hoy.