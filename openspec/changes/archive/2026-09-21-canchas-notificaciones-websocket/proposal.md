## Why

Staff y clientes de Sistema Canchas (B2B) operan las reservas a ciegas: un staff no sabe cuándo un cliente reserva hasta que refresca el listado, y un cliente no sabe si su reserva fue confirmada, cancelada o reprogramada hasta que vuelve a entrar. Hoy no existe ningún canal de notificación para el B2B (el WebSocket actual pertenece al juego EL Pizarrón y autentica con su propio JWT, ajeno al `b2b-jwt`). Hace falta un sistema de notificaciones en tiempo real que informe el ciclo de vida de las reservas y permita avisos del complejo, con historial persistido y no leídos.

## What Changes

- **Gateway B2B de WebSocket** (socket.io, mismo path que el existente): autentica con el JWT de Sistema Canchas (`b2b-jwt`). El staff se suscribe al canal de su organización (`b2b:org:<organizationId>`), y cada usuario al suyo propio (`b2b:user:<userId>`).
- **Notificaciones persistentes**: nueva entidad `b2b_notifications` (destinatario, organización, tipo, severidad, título, cuerpo, metadata, `read`, `createdAt`). Cada notificación se materializa por destinatario (fan-out) para que el contador de no leídos sea por usuario.
- **Eventos de reserva** (emitidos desde `B2bManagementService`):
  - Reserva nueva (PENDING) → notificar al staff del complejo.
  - Confirmación / cancelación / completado → notificar al cliente.
  - Reprogramación → notificar a staff del complejo y al cliente.
  - Avisos generales del complejo (habitación broadcast `b2b:org:<organizationId>`) → notificar a todos los usuarios de la organización.
- **API REST** de historial y no leídos para usuarios B2B autenticados:
  - `GET /api/v1/notifications` — historial del usuario actual.
  - `POST /api/v1/notifications/:id/read` — marcar una notificación como leída.
  - `POST /api/v1/notifications/read-all` — marcar todo como leído.
- **Tipos compartidos**: extender `NotificationType` en `packages/shared/types/models.ts` con los eventos B2B (`b2b_booking_pending`, `b2b_booking_confirmed`, `b2b_booking_cancelled`, `b2b_booking_completed`, `b2b_booking_rescheduled`, `b2b_org_announcement`).
- **Cliente B2B**:
  - Hook `useB2bNotificationSocket` que conecta con el token B2B, hidrata el historial desde REST al conectar/reconectar y recibe eventos en vivo.
  - Store derechado `useB2bNotificationStore` (separado del de la app principal) con lista e historial, no leídos y acciones.
  - Campana con badge de no leídos + panel dropdown y toasts en vivo, integrados al dashboard de staff y al portal de cliente.

## Capabilities

### New Capabilities
- `b2b-notifications`: notificaciones en tiempo real y persistidas para Sistema Canchas — canal WS por organización/usuario, eventos del ciclo de reservas, avisos del complejo, historial REST y no leídos.

### Modified Capabilities
- *(ninguno — no existe spec previo para el sistema B2B; los cambios canchas anteriores se archivaron en práctica)*

## Impact

- **Backend**: `apps/server/src/b2b/` — nuevo módulo `b2b-notifications/` (gateway, service, controller, entity `B2bNotificationEntity` sumada a `B2B_ENTITIES`); inyección del service en `B2bManagementService` para emitir en `createBooking`, `transitionBooking` y `rescheduleBooking` (fan-out a staff/clientes según evento). Reutiliza `packages/shared/types` (`NotificationType`, `Severity`, `NotificationPayload`) y `b2b-jwt` existente.
- **Frontend**: `apps/client/` — `B2bApp.tsx` (campana en header de dashboard y portal), hook y store B2B, toasts. `vite.config.ts` ya proxya `/socket.io`.
- **SSOT**: `openspec/specs/` — nueva spec `b2b-notifications`.
- **Esquema DB**: nueva tabla `b2b_notifications` creada vía `synchronize` (mismo patrón de entidades B2B recientes: availability-blocks, booking-events; sin migración nueva).
- **Tests**: spec unitario para el service de notificaciones (fan-out staff/usuario y emisión desde management), + ampliación del smoke test E2E `b2b-smoke-test.mjs`.