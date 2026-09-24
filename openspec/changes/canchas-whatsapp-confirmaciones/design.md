# Design: Confirmaciones y comprobantes por WhatsApp

## Goal and Non-Goals

Goals: R1 comprobante por deep-link tras el pago; R2 confirmación automática al
cliente al confirmarla el staff; R3 botón de asistencia a 30 minutos con envío
por servidor. Sin cambios de esquema ni nuevas tablas.

## Tech Context / Constraints

- `MessagingService.send(to, body, kind, metadata)` delegando en
  `MessageProvider` (hoy `log`); `canSendWhatsApp(phone, optIn)` en
  `domain-policy.ts`.
- Contacto: `b2b_users.{whatsappPhone,whatsappOptIn}`,
  `b2b_organizations.{whatsappPhone,whatsappOptIn}`.
- `B2bManagementService` construye `transitionBooking`/`createBooking`; sus specs
  lo instancian posicionalmente (11 args) → el nuevo `MessagingService` entra de
  último (12.º).
- `B2bRolesGuard` deja pasar endpoints sin metadata de roles (cliente usa
  `cancel`, `reschedule`): el endpoint nuevo hereda ese comportamiento.
- Client: "Mis turnos" para clientes no existe (RealClientView renderiza el
  portal como fallback); hay que crearlo para R3.

## Decisions

### D1 · Comprobante por deep-link (client-side)

Helper `buildWhatsAppDeepLink(phone, text)` en `b2bService.ts`: quita `+` y
spacios del teléfono y arma `https://wa.me/<digitos>?text=<encodeURIComponent>`.
`PaymentView` recibe por props el summary de la reserva (cancha, día/hora local,
monto, bookingId, complejo) y obtiene el teléfono del complejo con
`b2bService.getOrganization()` (en new `RealClientView`). Botón oculto si falta
org phone.

### D2 · R2 confirmación automática al cliente

`MessagingService` inyectado al final del constructor de `B2bManagementService`.
En `transitionBooking`, rama `status === CONFIRMED`, tras la notificación in-app:
helper privado `sendBookingWhatsApp(booking, kind, audience)` que:
1. resuelve el mensaje con cancha/fecha/hora local (reusa `bookingNotification`),
2. para `client`: carga `b2b_users` del reservante y gatea con
   `canSendWhatsApp(client.whatsappPhone, client.whatsappOptIn)`;
3. para `organization`: gatea con `canSendWhatsApp(org.whatsappPhone,
   org.whatsappOptIn)`;
4. `MessagingService.send(...)`; todo dentro de try/catch que solo loguea.

### D3 · R3 botón de asistencia

Método `confirmAttendance(user, bookingId)`:
- carga la reserva (org-scoped); 404 si no existe o no es del cliente/staff;
- rechaza estados terminales y ventana fuera de `0 ≤ startsAt−now ≤ 30min` (409);
- envía WhatsApp al complejo (gate org); devuelve `{ sent, message }`.
Endpoint `POST /bookings/:id/confirm-attendance` (B2bJwtGuard+B2bRolesGuard,
sin decorador de rol): clientes y staff.

### D4 · Frontend "Mis turnos" (client)

Nueva vista `ClientBookingsView` (subcomponente en B2bApp.tsx), enrutada desde
`RealClientView` para `view === 'bookings'`:
- carga `b2bService.getBookings()` (el server ya filtra por clientUserId);
- ticker de 30s fuerza re-render para habilitar el botón al entrar a la ventana;
- botón → `b2bService.confirmAttendance(id)`; feedback con el `message` y
  deshabilitado tras confirmar.

### D5 · Mensajes (es-AR)

- confirmación al cliente (kind `confirmation`): "Tu reserva en {cancha}
  ({formato}) del {fecha} a las {hora} fue confirmada por {complejo}."
- asistencia al dueño (kind `reminder`): "{cliente} confirmó asistencia al turno
  de las {hora} en {cancha} ({fecha})."
- comprobante (deep-link, texto plano): título + cancha/fecha/hora/monto/
  referencia + complejo.

### D6 · Cobertura de tests

- Spec nueva `whatsapp-confirmations.spec.ts` (B2bManagementService): R2 (envía
  cuando hay phone+opt-in; no envía sin opt-in; fallo de send no rompe
  transición) y R3 (happy path sent:true, ventana fuera → 409, org sin
  WhatsApp → sent:false).
- Actualizar las 5 suites existentes que instancian el servicio para pasar el
  mock de MessagingService.
- Client: build (tsc) como verificación.

## Risks / Trade-offs

- Autenticidad del "comprobante": es un texto editable, no el comprobante de una
  pasarela; aceptado (pago simulado, R fuera de scope). Al integrar pasarela, el
  texto se arma del pago real.
- Ventana de 30 min fija por ahora; parametrizable luego.
- El envío R2/R3 sigue dependiendo del adaptador real (hoy log); documentado en
  el proposal.