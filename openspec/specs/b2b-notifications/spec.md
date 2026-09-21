# b2b-notifications

## Purpose

Define el sistema de notificaciones de Sistema Canchas (B2B): persistencia por destinatario, emisión en tiempo real por WebSocket, los eventos de reservas y avisos del complejo, el historial REST con estado de leído y el cliente de notificaciones en el frontend B2B.

## Requirements

### Requirement: Gateway B2B autenticado por WebSocket
El sistema MUST proveer un gateway de socket.io (path `/socket.io`) que autentique cada conexión verificando el JWT de Sistema Canchas (`B2B_JWT_SECRET`) y extrayendo `userId`, `organizationId` y `roles`. Las conexiones con token inválido o sin identidad MUST ser rechazadas. Un cliente con rol staff (OWNER/ADMIN/OPERATOR) MUST suscribirse al canal de su organización (`b2b:org:<organizationId>`) y a su canal personal (`b2b:user:<userId>`); un cliente con rol CLIENT MUST suscribirse solo a su canal personal.

#### Scenario: Staff se conecta con token B2B
- **WHEN** un staff se conecta enviando un JWT de Sistema Canchas válido como `auth.token`
- **THEN** el gateway lo suscribe a `b2b:org:<organizationId>` y a `b2b:user:<userId>` y mantiene la conexión

#### Scenario: Cliente se conecta con token B2B
- **WHEN** un cliente se conecta enviando un JWT de Sistema Canchas válido como `auth.token`
- **THEN** el gateway lo suscribe únicamente a `b2b:user:<userId>`

#### Scenario: Token inválido o ausente
- **WHEN** una conexión envía un token inválido o no envía identidad por `auth.token`
- **THEN** el gateway desconecta la conexión sin suscribirla

### Requirement: Emisión de notificaciones con persistencia por destinatario
El sistema MUST persistir cada notificación como una fila por destinatario en la tabla `b2b_notifications` (con `organizationId`, `recipientUserId`, `type`, `severity`, `title`, `body`, `metadata`, `read` y `createdAt`) y MUST emitirla en tiempo real por el canal correspondiente. En eventos dirigidos al staff de un complejo, el sistema MUST insertar una fila por cada integrante staff de la organización y emitir al canal `b2b:org:<organizationId>`. El actor del evento NO recibirá su propia notificación (fila ni push). Cuando una notificación dirigida a un usuario puntual (p. ej. un cliente) se persiste, el push en vivo por su canal personal incluye el `id` de la fila.

#### Scenario: Evento dirigido al staff
- **WHEN** se genera una notificación para el staff de una organización con N integrantes staff
- **THEN** se insertan N filas en `b2b_notifications` y se emite el payload al canal `b2b:org:<organizationId>`

#### Scenario: Evento dirigido a un usuario
- **WHEN** se genera una notificación para un usuario específico
- **THEN** se inserta una fila en `b2b_notifications` para ese usuario y se emite el payload id'd a su canal `b2b:user:<userId>`

#### Scenario: No se auto-notifica al actor
- **WHEN** el destinatario de una notificación es el mismo usuario que ejecutó la acción
- **THEN** no se inserta fila ni se emite evento para ese usuario

### Requirement: Eventos de reservas notificados
El sistema MUST notificar en tiempo real el ciclo de vida de las reservas con los siguientes destinos:

| Evento | Tipo | Destino |
|---|---|---|
| Reserva creada (PENDING) | `b2b_booking_pending` | staff del complejo |
| Reserva confirmada | `b2b_booking_confirmed` | cliente |
| Reserva cancelada | `b2b_booking_cancelled` | la contraparte (staff si canceló el cliente; cliente si canceló el staff) |
| Reserva completada | `b2b_booking_completed` | cliente |
| Reserva reprogramada | `b2b_booking_rescheduled` | la contraparte según quién la ejecute |

Cada notificación MUST incluir como `metadata`: `bookingId`, `courtId`, `courtName`, `shiftStartsAt` y `clientUserId`, con un `title` y `body` legibles que identifiquen la cancha y el horario del turno.

#### Scenario: Cliente reserva un turno
- **WHEN** un cliente crea una reserva PENDING
- **THEN** cada integrante staff del complejo recibe una notificación `b2b_booking_pending` con cancha y horario del turno

#### Scenario: Staff confirma la reserva
- **WHEN** un staff confirma una reserva PENDING
- **THEN** el cliente recibe una notificación `b2b_booking_confirmed`

#### Scenario: Staff cancela la reserva
- **WHEN** un staff cancela una reserva
- **THEN** el cliente recibe una notificación `b2b_booking_cancelled`

#### Scenario: Cliente cancela su propia reserva
- **WHEN** un cliente cancela su reserva
- **THEN** el staff del complejo recibe una notificación `b2b_booking_cancelled` y el cliente no recibe auto-notificación

#### Scenario: Reserva completada
- **WHEN** un staff completa una reserva
- **THEN** el cliente recibe una notificación `b2b_booking_completed`

#### Scenario: Reserva reprogramada por staff
- **WHEN** un staff reprograma la reserva de un cliente
- **THEN** el cliente recibe una notificación `b2b_booking_rescheduled` con el nuevo horario

### Requirement: Avisos generales del complejo
El sistema MUST permitir a un staff emitir un aviso general (`b2b_org_announcement`) dirigido a todos los usuarios de la organización. El aviso MUST insertarse como fila por cada usuario de la organización excepto el actor que lo publica, emitirse al canal `b2b:org:<organizationId>` y al canal personal de cada integrante staff.

#### Scenario: Staff publica un aviso general
- **WHEN** un staff publica un aviso general del complejo
- **THEN** todos los usuarios de la organización (excepto el actor) reciben una notificación `b2b_org_announcement` (persistida y en tiempo real)

#### Scenario: Cliente intenta publicar un aviso general
- **WHEN** un usuario con rol CLIENT intenta publicar un aviso general
- **THEN** el sistema rechaza la operación (403)

### Requirement: Historial REST y estado de leído
El sistema MUST exponer endpoints REST autenticados (`GET /api/v1/notifications`) que devuelvan el historial del usuario actual (`items` ordenado DESC, límite 100, y `unreadCount`). El sistema MUST proveer `POST /api/v1/notifications/:id/read` para marcar una notificación como leída y `POST /api/v1/notifications/read-all` para marcar todas las del usuario como leídas. Las operaciones de marcado MUST estar limitadas a las notificaciones del usuario autenticado.

#### Scenario: Usuario carga su historial
- **WHEN** un usuario B2B autenticado solicita `GET /api/v1/notifications`
- **THEN** recibe sus notificaciones ordenadas de más reciente a más antigua (máx. 100) y el conteo de no leídas

#### Scenario: Usuario marca una notificación como leída
- **WHEN** un usuario marca una notificación propia como leída vía `POST /api/v1/notifications/:id/read`
- **THEN** la notificación queda con `read=true` y el `unreadCount` disminuye

#### Scenario: Usuario intenta marcar una notificación ajena
- **WHEN** un usuario intenta marcar como leída una notificación de otro usuario
- **THEN** la operación no modifica ninguna fila del otro usuario

#### Scenario: Reconexión del cliente
- **WHEN** un cliente reconecta su WebSocket después de estar desconectado
- **THEN** recibe en tiempo real los eventos posteriores y puede recuperar el historial pendiente vía REST

### Requirement: Cliente de notificaciones en el frontend B2B
El frontend de Sistema Canchas MUST conectar el WebSocket con el token B2B cuando el usuario esté logueado. MUST mostrar una campana con badge del conteo de no leídas tanto en el dashboard de staff como en el portal de cliente, con un panel de historial que permita marcar todo como leído. Cada notificación recibida en vivo MUST mostrarse también como toast auto-dismiss. Al iniciar o reconectar, el frontend MUST hidratar el historial desde `GET /api/v1/notifications`.

#### Scenario: Staff ve una reserva nueva en vivo
- **WHEN** un cliente crea una reserva mientras un staff tiene el dashboard abierto
- **THEN** el staff recibe al instante un toast "Nueva reserva" y el badge de la campana incrementa

#### Scenario: Cliente ve el estado de su reserva
- **WHEN** un staff confirma/cancela/completa la reserva de un cliente conectado
- **THEN** el cliente recibe al instante un toast con el estado nuevo y una notificación en su panel

#### Scenario: Historial al recargar la página
- **WHEN** un usuario B2B recarga la página con el token vigente
- **THEN** la campana muestra su historial persistido y el badge refleja el conteo de no leídas correcto

### Requirement: Tipos de notificación B2B compartidos
El paquete compartido (`packages/shared/types`) MUST incluir los tipos `b2b_booking_pending`, `b2b_booking_confirmed`, `b2b_booking_cancelled`, `b2b_booking_completed`, `b2b_booking_rescheduled` y `b2b_org_announcement` dentro de la unión `NotificationType`, conservando `Severity` y `NotificationPayload` para los payloads emitidos.

#### Scenario: Tipos disponibles en el frontend y backend
- **WHEN** el backend y el frontend referencian tipos de notificación B2B
- **THEN** los seis tipos B2B están tipados en `NotificationType` del paquete compartido y el payload emitido por WS es un `NotificationPayload`