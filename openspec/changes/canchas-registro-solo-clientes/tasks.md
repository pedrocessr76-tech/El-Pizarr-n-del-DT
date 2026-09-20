## 1. Backend — retirar registro público de staff

- [x] 1.1 Eliminar la ruta `POST /api/v1/auth/register` en `B2bAuthController` junto con el DTO `RegisterB2bDto`.
- [x] 1.2 Eliminar el método `registerOrganization` y sus importaciones sin uso en `B2bAuthService`.
- [x] 1.3 Verificar que no queden referencias a `registerOrganization` ni `/api/v1/auth/register` en el código (fuera de docs históricos).
- [x] 1.4 Ejecutar typecheck y build del servidor.

## 2. Frontend — registro solo de clientes y login por rol

- [x] 2.1 Eliminar el selector de rol (`profile-picker`) de `B2bLogin` en `B2bApp.tsx`; el modo registro muestra únicamente el formulario de cliente.
- [x] 2.2 Quitar las props `role`, `onRoleChange` y `onRegister` de `B2bLogin` y el handler `registerOrganization`.
- [x] 2.3 En `enterB2b`, setear el rol local desde `user.roles` y navegar por rol autenticado (CLIENT → `portal`, staff → `dashboard`) sin fallback manual.
- [x] 2.4 Eliminar el método `register` (organización) de `useB2bStore`.
- [x] 2.5 Eliminar el método `register` de `b2bService`.
- [x] 2.6 Ajustar los textos del login/registro para reflejar el registro de cuenta de cliente.
- [x] 2.7 Ejecutar typecheck y build del cliente.

## 3. Scripts y tests

- [x] 3.1 Actualizar `apps/server/scripts/b2b-smoke-test.mjs` para no depender de `/api/v1/auth/register` (usar seed para staff y `register-client` para clientes).
- [x] 3.2 Correr los tests Jest del backend (95/95) y el smoke test local (63/63 OK).

## 4. Validación

- [x] 4.1 Validar en entorno local/Docker: `register` de organización devuelve 404, `register-client` crea cuenta CLIENT y `login` devuelve roles distintos (staff `ADMIN` / cliente `CLIENT`).