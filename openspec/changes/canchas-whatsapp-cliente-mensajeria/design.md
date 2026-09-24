## Context

Sistema Canchas (B2B) no tiene ningún canal de mensajería. Las notificaciones existentes son in-app (WebSocket + persistencia en `b2b_notifications`). `B2bUserEntity` y `B2bOrganizationEntity` no tienen teléfono ni consentimiento, y no existe endpoint para editar el perfil (`me` es solo lectura del JWT re-resuelto en BD). La base B2B corre con `B2B_DB_SYNCHRONIZE=false`, así que todo cambio de esquema es por migración en `apps/server/src/b2b/migrations/`.

El objetivo de este change es la base para el roadmap de mensajería (#37 contacto, #34 recordatorios, #36 resumen diario): **dato de contacto + consentimiento + un servicio de mensajería desacoplado** que no fuerce elegir proveedor pago hoy.

## Goals / Non-Goals

**Goals:**
- Persistir `whatsappPhone` (E.164) y `whatsappOptIn` en usuario y organización B2B, vía migración.
- Endpoint `PATCH /api/v1/auth/profile` (usuario) y `PATCH /api/v1/auth/organization` (staff, contacto del complejo), con validación y normalización de teléfono.
- `GET /api/v1/auth/me` enriquecido con el contacto del usuario y del complejo.
- Vista de perfil en el frontend B2B (cliente y staff) con formulario de WhatsApp y opt-in explícito.
- `MessagingService` con interfaz única y adaptador **log/placeholder** por defecto; sin dependencias externas ni credenciales obligatorias.

**Non-Goals:**
- Integrar un proveedor real (WhatsApp Cloud API / whatsapp-web.js): queda como enchufe futuro sobre la misma interfaz.
- Implementar los envíos en sí (#34 reloj/recordatorios, #36 resumen diario): este change solo deja el canal y el dato listos para consumirlos.
- Enviar a números sin consentimiento (regla hard: si `whatsappOptIn=false` no se ejecuta el envío).

## Decisions

### D1. Modelo de datos: columnas en `b2b_users` y `b2b_organizations`
Agregar a ambas entidades:
- `whatsappPhone` varchar(20) nullable — E.164 normalizado (`+5491100000000`), `null` = sin WhatsApp.
- `whatsappOptIn` boolean `NOT NULL DEFAULT false`.

**Alternativas:** tabla separada de contactos o tabla de "tipos de contacto". Descartadas: sobre-ingeniería para dos campos que acompañan a cada fila y que casi siempre se leen juntos (perfil del usuario / perfil del complejo).

### D2. Migración manual (B2B usa `synchronize=false`)
Nueva migración `1710000000002-CreateB2bWhatsappContacts.ts` que hace `ALTER TABLE b2b_users/b2b_organizations ADD COLUMN`. Cada migración lleva su `.spec.ts` con `recordingQueryRunner` (patrón de `1710000000000-CreateB2bSchema.spec.ts`).

### D3. Normalización y validación de teléfono
Función pura `normalizeWhatsAppPhone(input): string | null` (en `b2b/phone.ts`): separa espacios/guiones/paréntesis y valida contra `^\+[1-9]\d{1,14}$` (E.164 user-facing). Entrada vacía → `null` (desactiva). Inválida → BadRequest. Es unit-testable sin IO.

### D4. API de perfil
- `PATCH /api/v1/auth/profile` (`B2bJwtGuard`): body `{ whatsappPhone?: string; whatsappOptIn?: boolean }`. Actualiza solo el usuario autenticado. Devuelve `{ userId, organizationId, email, roles, whatsappPhone, whatsappOptIn }`.
- `PATCH /api/v1/auth/organization` (`B2bJwtGuard` + role guard staff): actualiza el contacto de la organización. Devuelve `{ whatsappPhone, whatsappOptIn }`.
- `GET /api/v1/auth/me`: pasa a resolver de BD vía servicio (`getProfile`), devolviendo el contacto del usuario. **No** se meten el teléfono ni el opt-in al JWT (evita payload inflado y datos stale; los roles ya se re-resuelven en cada request).

**Alternativa considerada:** extender `B2bJwtUser` con teléfono. Descartada: el token firmaría un dato que cambia en runtime y la política del repo (issue #24/#17) ya re-resuelve identidad contra BD.

### D5. Frontend: vista `profile` en B2B
- `b2bService.ts`: `getProfile()` (≈ `me`), `updateProfile()`, `updateOrganizationContact()`.
- Nueva vista `profile` en `B2bView`; el tab mobile "Perfil" pasa a navegar a `profile` (hoy navega a `login`). Staff: botón en sidebar + botón de usuario del topbar.
- Componente `components/b2b/ProfileView.tsx`: bloque "Mi contacto" (input WhatsApp + checkbox consentimiento) siempre; bloque "Contacto del complejo" para staff. Persistencia con `PATCH` y refresco del estado local.

### D6. Mensajería desacoplada: módulo `b2b/messaging/`
- `messaging.types.ts`: `WhatsAppMessage`, `WhatsAppDeliveryResult`.
- `messaging.provider.ts`: interface `MessageProvider.send(message): Promise<WhatsAppDeliveryResult>`.
- `log-message.provider.ts`: proveedor por defecto — loguea el envío y devuelve `delivered: true` (placeholder, gratis, sin IO).
- `messaging.service.ts` (`@Injectable`): expone `send(to, body, opts)` que delega en el proveedor activo. No conoce nada de la BD.
- Fábrica en `messaging.module.ts`: selecciona el proveedor por `MESSAGING_PROVIDER` (env, default `log`). Proveedores futuros (Cloud API, whatsapp-web.js) implementan la misma interfaz sin tocar consumidores.
- Regla de consentimiento en `domain-policy.ts`: helper `canSendWhatsApp({ whatsappPhone, whatsappOptIn })` que los futuros consumidores (#34/#36) deben consultar antes de llamar `send`. El servicio recibe el destino ya validado por el dominio (mantiene el servicio agnóstico de negocio).

## Risks / Trade-offs

- **Fragmentación de la fábrica de proveedores** → La selección queda centralizada en `messaging.module.ts`; los consumidores dependen solo de `MessagingService.send`.
- **`me` cambia su forma (agrega campos)** → Es aditivo, no rompe el cliente actual (`hydrate` usa `refresh`, no `me`); el frontend nuevo lee los campos nuevos.
- **Migración manual en un esquema con datos** → La migración es ADD COLUMN nullable/default false, no destructiva; rollback con `down()` que dropea ambas columnas.
- **Placeholder log puede dar falsa sensación de "WhatsApp funcionando"** → El proveedor loguea `provider:"log"` en el resultado y la UI del perfil no promete entregas; queda documentado en el design y en `.env.example` (`MESSAGING_PROVIDER=log`).

## Migration Plan

1. Crear migración `CreateB2bWhatsappContacts1710000000002` + spec (sube/dropea columnas).
2. Backend: entidades + `phone.ts` + service + controller (profile/organization/me enriquecido) + specs unitarias.
3. Módulo `messaging/` + registro en `b2b.module.ts` + spec del servicio con provider log.
4. Frontend: `b2bService`, `ProfileView`, wiring de vista `profile`.
5. `npm run test` en server; `npm run b2b:migration:run` local contra la base B2B; build de client.
6. Rollback: `b2b:migration:revert` (drop de columnas, no destructivo por diseño).

## Open Questions

- Ninguna bloqueante. El proveedor real y los envíos programados se resuelven en #34/#36 (otro change/spec).