## 1. Migración y modelo

- [x] 1.1 Crear migración `1710000000002-CreateB2bWhatsappContacts.ts`: `ALTER TABLE b2b_users` y `b2b_organizations` agregando `whatsappPhone varchar(20)` nullable y `whatsappOptIn boolean NOT NULL DEFAULT false`; `down()` dropea ambas columnas.
- [x] 1.2 Crear spec de la migración (`1710000000002-CreateB2bWhatsappContacts.spec.ts`) con `recordingQueryRunner` validando subidas y bajadas.
- [x] 1.3 Agregar `whatsappPhone` y `whatsappOptIn` a `B2bUserEntity` y `B2bOrganizationEntity`.

## 2. Utilidad y validación de teléfono

- [x] 2.1 Crear `apps/server/src/b2b/phone.ts` con `normalizeWhatsAppPhone(input): {valid, value}` (E.164 user-facing, regex `^\+[1-9]\d{1,14}$`, separa espacios/guiones/paréntesis, vacío → null).
- [x] 2.2 Crear spec unitaria de `phone.ts` (normalización, inválidos, vacío).

## 3. Backend de perfil

- [x] 3.1 Agregar método `updateProfile(userId, organizationId, { whatsappPhone?, whatsappOptIn? })` en `B2bAuthService` que normalice con `phone.ts` y persista; BadRequest si el formato es inválido.
- [x] 3.2 Agregar método `getProfile(userId, organizationId)` que devuelva `{ userId, organizationId, email, roles, whatsappPhone, whatsappOptIn }` resolviendo de BD.
- [x] 3.3 Agregar método `updateOrganizationContact(organizationId, input)` (staff) que actualice el contacto del complejo.
- [x] 3.4 Agregar `PATCH /api/v1/auth/profile` (B2bJwtGuard), `PATCH /api/v1/auth/organization` (staff), y cambiar `me` para usar `getProfile`, en `B2bAuthController` (`UpdateProfileDto`, `UpdateOrganizationContactDto` con validación).
- [x] 3.5 Specs unitarias de `B2bAuthService` para updateProfile/getProfile/updateOrganizationContact (patrón de `b2b-auth.service.spec.ts` + casos de opt-in y teléfono inválido).

## 4. Servicio de mensajería (adapter)

- [x] 4.1 Crear `apps/server/src/b2b/messaging/messaging.types.ts` (`WhatsAppMessage`, `WhatsAppDeliveryResult`).
- [x] 4.2 Crear interface `MessageProvider` en `messaging.provider.ts`.
- [x] 4.3 Crear `LogMessageProvider` (placeholder: loguea y devuelve `delivered: true`, `provider: 'log'`).
- [x] 4.4 Crear `MessagingService` (`@Injectable`) con `send(to, body, opts?)` que delega en el proveedor activo.
- [x] 4.5 Crear `messaging.module.ts` con fábrica que selecciona el proveedor por `MESSAGING_PROVIDER` (default `log`); registrar en `B2bModule`.
- [x] 4.6 Agregar helper `canSendWhatsApp({ whatsappPhone, whatsappOptIn })` en `domain-policy.ts` y spec.
- [x] 4.7 Spec unitaria de `MessagingService` con proveedor log.

## 5. Configuración

- [x] 5.1 Documentar `MESSAGING_PROVIDER=log` (placeholder) en `.env.example`; variables opcionales del proveedor real comentadas.
- [x] 5.2 Dejar el server arrancando sin credenciales de mensajería (sin error de boot) — el módulo cae a `LogMessageProvider` por defecto.

## 6. Frontend

- [x] 6.1 Agregar `getProfile`, `updateProfile` y `updateOrganizationContact` en `apps/client/src/services/b2bService.ts` (con tipos).
- [x] 6.2 Crear `components/b2b/ProfileView.tsx`: bloque "Mi contacto" (WhatsApp + opt-in explícito) y bloque "Contacto del complejo" para staff.
- [x] 6.3 Agregar vista `profile` al union `B2bView` y enrutarla en `B2bApp.tsx` (topbar de usuario y tab mobile "Perfil" → `profile`, sidebar staff/client).
- [x] 6.4 Styling de `ProfileView` reutilizando clases CSS B2B existentes (+ `.wa-optin-row`, `.settings-panel-actions`).

## 7. Verificación

- [x] 7.1 `npm run test` (workspace server): 201 tests en verde, 22 suites.
- [ ] 7.2 Ejecutar `b2b:migration:run` local y verificar `migration:show`.
- [ ] 7.3 Build de client y smoke del flujo perfil (login → editar WhatsApp → opt-in → persistencia).