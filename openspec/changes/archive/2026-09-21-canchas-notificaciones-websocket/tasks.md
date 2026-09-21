## 1. Backend: entidad y módulo de notificaciones B2B

- [x] 1.1 Crear `apps/server/src/b2b/notifications/b2b-notification.entity.ts` con `B2bNotificationEntity` (`b2b_notifications`): `id` uuid PK, `organizationId` uuid indexado, `recipientUserId` uuid indexado (NOT NULL), `type` varchar(40), `severity` varchar(12), `title`, `body`, `metadata` jsonb default `{}`, `read` boolean default false, `createdAt` timestamptz default `CURRENT_TIMESTAMP`; índice `(recipientUserId, read)`.
- [x] 1.2 Sumar `B2bNotificationEntity` a `B2B_ENTITIES` en `apps/server/src/b2b/b2b.module.ts`.
- [x] 1.3 Crear `apps/server/src/b2b/notifications/b2b-notifications.gateway.ts`: `@WebSocketGateway({ cors, path: '/socket.io' })` que verifica el JWT B2B (`B2B_JWT_SECRET`) en `handleConnection` (payload `{ userId, organizationId, roles }`), desconecta si es inválido/ausente, y suscribe staff a `b2b:org:<organizationId>` + `b2b:user:<userId>` y clientes a `b2b:user:<userId>`; `handleDisconnect` limpia mapa de conexiones; emite `'notification'` a un canal dado.
- [x] 1.4 Crear `apps/server/src/b2b/notifications/b2b-notifications.service.ts`: inyecta repos `B2bNotificationEntity`, `B2bUserRoleEntity`, `B2bUserEntity` (conexión `'b2b'`); métodos `notifyStaff(organizationId, opts)` (resuelve staff OWNER/ADMIN/OPERATOR, persiste fila por staff, emite `b2b:org:<orgId>`), `notifyUser(userId, organizationId, opts, actorUserId?)` (persiste + emite `b2b:user:<userId>`), `broadcastToOrganization(organizationId, opts)` (todos los usuarios de la org: fila por usuario + emisión a org y a cada canal personal), `listForUser(user, limit=100)`, `markRead(user, id)`, `markAllRead(user)` y `getStaffUserIds(organizationId)` / `getUserDisplayName(userId)`; supresión si `recipientUserId === actorUserId`.
- [x] 1.5 Crear `apps/server/src/b2b/notifications/b2b-notifications.controller.ts` (`@Controller('api/v1/notifications')`, `@UseGuards(B2bJwtGuard)`): `GET /` → `{ items, unreadCount }`, `POST /:id/read`, `POST /read-all`, y `POST /` (solo roles staff) para aviso general → `broadcastToOrganization`.
- [x] 1.6 Crear `apps/server/src/b2b/notifications/b2b-notifications.module.ts` (`TypeOrmModule.forFeature([...], 'b2b')`, `JwtModule`, gateway/service/controller, exporta el service) e importarlo en `B2bModule` (el service queda disponible para `B2bManagementService`).
- [x] 1.7 Verificar build del server (`npm run build -w server` o `tsc`) y que `B2B_ENTITIES` no rompe la conexión `'b2b'`.

## 2. Backend: tipos compartidos

- [x] 2.1 En `packages/shared/types/models.ts`, agregar a la unión `NotificationType` los valores `b2b_booking_pending`, `b2b_booking_confirmed`, `b2b_booking_cancelled`, `b2b_booking_completed`, `b2b_booking_rescheduled`, `b2b_org_announcement`.
- [x] 2.2 Verificar que ningún switch exhaustivo del juego se rompa (grepo de `NotificationType`/`payload.type`) y ajustar si la UI del juego switcha por tipo.

## 3. Backend: emisión desde el ciclo de reservas

- [x] 3.1 Inyectar `B2bNotificationsService` en `B2bManagementService` (constructor) y componer mensajes B2B (title/body legibles con nombre de cancha y horario del turno; `metadata` con `bookingId`, `courtId`, `courtName`, `shiftStartsAt`, `clientUserId`).
- [x] 3.2 `createBooking`: tras `recordEvent`, notificar al staff del complejo (`b2b_booking_pending`, severity info).
- [x] 3.3 `transitionBooking`: al CONFIRMED notificar al cliente (`b2b_booking_confirmed`, success); al COMPLETED notificar al cliente (`b2b_booking_completed`, success); al CANCELLED notificar a la contraparte según quién ejecute (staff→cliente, cliente→staff de la org) (`b2b_booking_cancelled`, warning).
- [x] 3.4 `rescheduleBooking`: al reprogramar, notificar a la contraparte según el actor (`b2b_booking_rescheduled`, info).
- [x] 3.5 Ajustar los specs existentes de `B2bManagementService` (ej. `schedule.service.spec.ts`, `b2b-management` spec si existe) que instancian el service, pasando un mock de `B2bNotificationsService`.

## 4. Frontend B2B: store, servicio y socket

- [x] 4.1 Crear `apps/client/src/store/useB2bNotificationStore.ts` (Zustand): `{ items, unreadCount, hydrated, setItems, addFromServer, markRead, markAllRead, reset }`; `addFromServer` evita duplicados por `id`.
- [x] 4.2 Crear `apps/client/src/services/b2bNotificationService.ts`: `list()`, `markRead(id)`, `markAllRead()`, `sendAnnouncement(body)` usando el cliente axios/API B2B existente con el token B2B.
- [x] 4.3 Crear `apps/client/src/services/b2bNotificationSocket.ts` con `useB2bNotificationSocket()`: conecta `io` (mismo origen, path `/socket.io`, transports poll+ws) con `auth.token` = token B2B; al conectar/reconectar hidrata `GET /api/v1/notifications`; en `'notification'` agrega al store y dispara toast; limpia al desloguearse.

## 5. Frontend B2B: UI

- [x] 5.1 Crear `apps/client/src/components/b2b/B2bNotificationBell.tsx`: campana (Material Symbols) con badge de `unreadCount`, panel dropdown con historial (scroll), botón "Marcar todo leído" y acción por notificación; estilos consistentes con el layout B2B (`b2b-*`).
- [x] 5.2 Crear `apps/client/src/components/b2b/B2bNotificationToasts.tsx`: toasts auto-dismiss (info/success/warning) con la severidad correspondiente.
- [x] 5.3 Integrar en `apps/client/src/pages/B2bApp.tsx`: montar `useB2bNotificationSocket`, la campana en el header del dashboard de staff y del portal de cliente, los toasts a nivel layout, y `reset()` al cerrar sesión.
- [x] 5.4 Verificar build y lint del cliente (`npm run build -w client`, `npm run lint` si existe).

## 6. Pruebas

- [x] 6.1 Crear `apps/server/src/b2b/notifications.service.spec.ts`: fan-out de `notifyStaff` (persiste N filas y emite al canal de org), `notifyUser` (persiste y emite canal personal), supresión de auto-notificación, `markRead` scoped, `markAllRead` y `getStaffUserIds` filtrando solo roles staff.
- [x] 6.2 Añadir assertions de notificaciones en los tests de `B2bManagementService`: `createBooking` llama a `notifyStaff`, `transitionBooking` a confirmar/cancelar/completar llama al destinatario correcto, cancelación por cliente no auto-notifica.
- [x] 6.3 Correr la suite Jest del server completa (`npx jest --runInBand` desde `apps/server`) sin regresiones.
- [x] 6.4 Ampliar `apps/server/scripts/b2b-smoke-test.mjs`: tras crear/reservar y confirmar, verificar `GET /api/v1/notifications` para staff (PENDING) y cliente (CONFIRMED/CANCELLED), y `POST read`/`read-all` actualizan el conteo.
- [x] 6.5 Correr el smoke E2E completo (`npm run test:b2b`) contra el stack Docker con el código nuevo (rebuild del server) y confirmar que el juego (app principal) no recibe eventos B2B.

## 7. Verificación final y commit

- [ ] 7.1 Revisar `git status`/`git diff`, arrancar el stack Docker, verificar manualmente en `http://localhost:5173` un flujo completo: cliente reserva → staff ve toast/campana → staff confirma → cliente ve confirmación.
- [x] 7.2 `openspec validate --change canchas-notificaciones-websocket` sin errores.
- [ ] 7.3 Commit de los cambios en `dev` siguiendo el estilo del repo.