## Context

Sistema Canchas (B2B) maneja reservas por complejo/organización con roles de staff (OWNER/ADMIN/OPERATOR) y clientes. Las transiciones viven en `B2bManagementService` (`createBooking`, `transitionBooking`, `rescheduleBooking`), autenticadas con el JWT propio del B2B (`B2B_JWT_SECRET`, payload `{ userId, organizationId, email, roles }`).

El único sistema de notificaciones realtime existente pertenece al juego EL Pizarrón (`NotificationsGateway`/`NotificationsService`): valida el JWT de la app (`{ sub }`), emite a canales `notification:<userId|sessionId>` y no conoce el dominio B2B (ni `organizationId` ni roles). Los clientes web de B2B comparten backend pero no consumen ese gateway. Hoy no hay forma de enterarse de una reserva nueva ni de su confirmación/cancelación sin refrescar.

El stack (NestJS + TypeORM/Postgres conexión `'b2b'`, socket.io ya instalado, Zustand + Tailwind en el cliente, monorepo npm workspaces, `packages/shared/types` compartido) soporta agregar el sistema B2B sin dependencias nuevas.

## Goals / Non-Goals

**Goals:**
- Notificaciones **en tiempo real** (socket.io) para usuarios B2B, con autenticación propia (`b2b-jwt`).
- Notificaciones **persistentes** por destinatario con estado leído/no leído (historial recuperable al reconectar).
- Eventos del ciclo de reservas → destinatario correcto:
  - Reserva nueva (PENDING) → staff del complejo.
  - Confirmación / cancelación / completado → cliente (o al staff si el actor de la cancelación es el cliente).
  - Reprogramación → a la contraparte según quien la ejecute.
  - Avisos generales del complejo → todos los usuarios de la organización.
- Campana con badge de no leídos + panel historial + toasts en el dashboard de staff y portal de cliente.
- Tipos compartidos: nuevos `NotificationType` B2B reutilizando `NotificationPayload`/`Severity`.

**Non-Goals:**
- No se modifica el sistema de notificaciones del juego EL Pizarrón (conviven aislados).
- Sin emails/push/SMS; solo WebSocket + REST.
- Sin suscripciones selectivas por parte del usuario (no hay pantalla de preferencias).
- Sin paginación fina del historial (límite de 100 por carga inicial).

## Decisions

### 1) Gateway B2B separado (no reutilizar `NotificationsGateway`)
`B2bNotificationsGateway` nuevo con las mismas opciones de socket.io (`path: '/socket.io'`, CORS abierto) pero que verifica el **JWT B2B** con `B2B_JWT_SECRET` y extrae `{ userId, organizationId, roles }`. Razones:
- Realms de JWT distintos; mezclar ambos en un gateway obligaría a probar dos secretos y complicaría el `handleConnection`.
- Canales con prefijo `b2b:` evitan colisión con `notification:<id>` del juego porque ambos gateways comparten el mismo `namespace`/`io` (habitaciones compartidas).
- Opción considerada: un solo gateway que intente ambos secretos. Descartado por acoplamiento entre dominios y pierde clarity sobre quién es quién.

Conexión autenticada → suscripciones:
- **Staff** (algún rol OWNER/ADMIN/OPERATOR): `b2b:org:<organizationId>` + `b2b:user:<userId>`.
- **Cliente** (solo CLIENT): `b2b:user:<userId>`.
- Token inválido o sin `userId`/`organizationId` → `client.disconnect()`.

### 2) Persistencia por destinatario (fan-out en filas)
Entidad `B2bNotificationEntity` (`b2b_notifications`):
`id` uuid PK, `organizationId` uuid (indexado), `recipientUserId` uuid (indexado, NOT NULL — el estado de leído es por usuario), `type` varchar(40), `severity` varchar(12), `title` varchar, `body` varchar, `metadata` jsonb default `{}`, `read` boolean default false, `createdAt` timestamptz default ahora. Índice `(recipientUserId, read)` para el badge.

Un evento dirigido a "staff de la org" inserta **una fila por integrante staff** (los roles se resuelven desde `B2bUserRoleEntity`). Alternativa considerada: una fila por evento con flag de organización → descartada porque el contador de no leídos no sería por usuario ni marcable individualmente.

### 3) Emisión `emit to room` + fila por destinatario
`B2bNotificationsService` (nuevo, en `b2b/notifications/`):
- `notifyStaff(organizationId, opts)` → resuelve staff (userRoles con `roleId` ∈ OWNER/ADMIN/OPERATOR), persiste fila por staff, emite a `b2b:org:<organizationId>`.
- `notifyUser(userId, organizationId, opts)` → persiste fila, emite a `b2b:user:<userId>`.
- `getStaffUserIds(organizationId)` y `getUserDisplayName(userId)` (para mensajes con nombre de cliente) como helpers internos.
- Repos inyectados: `B2bNotificationEntity`, `B2bUserRoleEntity`, `B2bUserEntity` (todos `'b2b'`, sin módulos nuevos a nivel producto).
- El formato del payload en WS es el `NotificationPayload` compartido (con `id`, `read` y `createdAt` añadidos como campos opcionales para que el cliente no duplique ids).

El **REST** (`B2bNotificationsController` en `@Controller('api/v1/notifications')`, `@UseGuards(B2bJwtGuard)`):
- `GET /` → `{ items, unreadCount }` del usuario autenticado (orden DESC, límite 100).
- `POST /:id/read` → marca leída (scoped a `recipientUserId`).
- `POST /read-all` → marca todo leído.
- `POST /` opcional para que el staff emita un **aviso general del complejo** (`b2b_org_announcement`) → fan-out a todos los usuarios de la org + emisión a `b2b:org:*` y a cada canal de usuario. Restringido a roles staff.

### 4) Puntos de emisión en `B2bManagementService`
Se inyecta `B2bNotificationsService` y se emite (con supresión de auto-notificación: si `recipientUserId === actorUserId` no se notifica):

| Acción | Notificación | Destino |
|---|---|---|
| `createBooking` (PENDING) | `b2b_booking_pending` — "Nueva reserva" (cancha, fecha/hora turno, nombre cliente) | staff de la org |
| `transitionBooking` → CONFIMED | `b2b_booking_confirmed` — "Reserva confirmada" | cliente |
| `transitionBooking` → CANCELLED | `b2b_booking_cancelled` — "Reserva cancelada" | la contraparte (staff si canceló el cliente; cliente si canceló el staff) |
| `transitionBooking` → COMPLETED | `b2b_booking_completed` — "Reserva completada" | cliente |
| `rescheduleBooking` | `b2b_booking_rescheduled` — "Reserva reprogramada" | la contraparte según el actor |

El mensaje incluye como `metadata`: `{ bookingId, courtId, courtName, shiftStartsAt, clientUserId }` para que el frontend pueda navegar/contextualizar. El nombre de la cancha se resuelve con el `courtId` ya disponible; el nombre del cliente con el helper del service.

### 5) Tipos compartidos
Extender la unión `NotificationType` en `packages/shared/types/models.ts` con: `b2b_booking_pending`, `b2b_booking_confirmed`, `b2b_booking_cancelled`, `b2b_booking_completed`, `b2b_booking_rescheduled`, `b2b_org_announcement`. Es aditivo y no rompe consumidores existentes. La UI del juego solo usa `severity`/`title`/`body` (verificación en tareas); la UI B2B no switcha por tipo.

### 6) Frontend B2B (store + hook + campana)
- `apps/client/src/store/useB2bNotificationStore.ts` — Zustand separado del de la app: `{ items, unreadCount, hydrated, setItems, addFromServer, markRead, markAllRead, reset }`.
- `apps/client/src/services/b2bNotificationService.ts` — REST (list / markRead / markAllRead) con el interceptor axios B2B existente.
- `apps/client/src/services/b2bNotificationSocket.ts` — `useB2bNotificationSocket()`: conecta `io` con `auth.token` = token B2B (mismo origen/proxy `/socket.io`); al conectar/reconectar hidrata vía REST; en `'notification'` agrega al store y dispara toast.
- `apps/client/src/components/b2b/B2bNotificationBell.tsx` — campana con badge (Material Symbols), panel dropdown con historial, "marcar todo leído"; y `B2bNotificationToasts` (toasts auto-dismiss apilados).
- Integración en `B2bApp.tsx`: la campana en el header del dashboard de staff y del portal de cliente; toasts montados a nivel del layout; `reset()` al cerrar sesión.
- Nada de esto toca la Navbar/NotificationBell del juego.

### 7) Esquema DB
La tabla `b2b_notifications` se crea vía `synchronize` (`B2B_DB_SYNCHRONIZE=true` en docker-compose/dev), **sin migración nueva**: mismo patrón de las entidades B2B recientes (availability-blocks, booking-events) que dependen de synchronize. `B2bNotificationEntity` se suma a `B2B_ENTITIES` en `b2b.module.ts`. (Nota: en producción con migraciones desactivadas habría que agregar migración; se documenta en riesgos como el comportamiento vigente del resto del B2B.)

## Risks / Trade-offs

- **Realm del gateway**: si en el futuro se comparte el canal `b2b:*` con otro servicio, los prefijos de habitación son el único límite real. → Mitigación: nombres de canal versionados documentados (`b2b:org:`, `b2b:user:`).
- **Oyentes del juego**: ambos gateways comparten el `Server` de socket.io; emitir con room no afecta a los suscriptores del juego porque los rooms están prefijados. → Verificación con smoke (cliente del juego sin recibir eventos B2B).
- **Fan-out**: insertar N filas por evento de reserva es O(staff) — aceptable en MVP donde los complejos tienen pocos integrantes. → Límite implícito: no hay límite duro; se documenta.
- **`NotificationType` ampliada**: cualquier switch exhaustivo sobre la unión del juego podría quejarse del tipo nuevo en TS. → Tarea de verificación; en la práctica la UI del juego mapea por `severity`.
- **Esquema por synchronize**: la tabla no aparecerá en entornos con migraciones estrictas sin una migración. → Mitigación: alineado con el patrón vigente; se agrega migración si la plataforma pasa a `B2B_DB_MIGRATIONS=true` en producción.
- **Auto-notificación**: el actor no debe recibir su propio evento (p. ej. cliente cancela su reserva). → Regla de supresión por `actorUserId` en el service de management.