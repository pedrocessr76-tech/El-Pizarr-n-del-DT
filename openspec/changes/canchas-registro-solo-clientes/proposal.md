## Why

En Sistema Canchas (B2B), el endpoint público `POST /api/v1/auth/register` permite a cualquiera crear una organización y un rol `OWNER` desde el frontend (formulario "Nueva organización"). Se quiere que las cuentas de administrador y dueño de cancha se creen únicamente por código (seed/script), y que el registro público solo cree cuentas de usuario cliente. Al iniciar sesión, la aplicación debe detectar automáticamente si el usuario es cliente o staff.

## What Changes

- **BREAKING**: Retirar la ruta pública `POST /api/v1/auth/register` (`registerOrganization`) que crea organización + rol `OWNER`.
- Mantener el seed actual que crea administradores por código (`B2bSeedService`). No crear un usuario admin de prueba nuevo.
- Mantener `POST /api/v1/auth/register-client` como único registro público: crea cuentas `CLIENT`.
- Mantener `POST /api/v1/auth/login` (ya devuelve roles reales) y usarlo para detectar si el usuario es cliente o staff.
- Frontend B2B: eliminar el selector de rol del login/registro. El registro solo muestra el formulario de cliente (email, nombre completo, contraseña). La navegación post-login se decide por los roles del JWT (CLIENT → portal de reservas; staff → dashboard de gestión).
- Eliminar `register` (organización) de `useB2bStore` y `b2bService`.
- Actualizar `apps/server/scripts/b2b-smoke-test.mjs` para no depender de `/api/v1/auth/register`.
- Mantener intactas las funcionalidades de administrador y dueño de cancha.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `saas-access`: restringir el autoregistro público a cuentas de cliente (`CLIENT`), prohibir la creación pública de roles de staff (`OWNER`/`ADMIN`/`OPERATOR`) y detectar el rol automáticamente al iniciar sesión para rutear la navegación.

## Impact

- Backend NestJS: `apps/server/src/b2b/auth/b2b-auth.controller.ts` y `b2b-auth.service.ts` (retiro de `registerOrganization` y su ruta).
- Scripts: `apps/server/scripts/b2b-smoke-test.mjs`.
- Frontend React: `apps/client/src/pages/B2bApp.tsx`, `apps/client/src/store/useB2bStore.ts`, `apps/client/src/services/b2bService.ts`.
- API pública: `/api/v1/auth`.