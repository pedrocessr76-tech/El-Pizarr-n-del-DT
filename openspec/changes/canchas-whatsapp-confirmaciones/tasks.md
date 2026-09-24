## 1. Backend: confirmación automática al cliente (R2)

- [x] 1.1 Inyectar `MessagingService` al final del constructor de `B2bManagementService`.
- [x] 1.2 Helper privado `sendBookingWhatsApp` (audience client/org, gate `canSendWhatsApp`, try/catch best-effort que solo loguea).
- [x] 1.3 Llamarlo en `transitionBooking` rama `CONFIRMED` (al cliente).
- [x] 1.4 Actualizar las specs `b2b-management.transactions`, `booking-notifications`, `metrics`, `court-management`, `schedule.service` para pasar el mock de messaging.
- [x] 1.5 Spec `whatsapp-confirmations.spec.ts`: envía si phone+opt-in; no envía sin opt-in; fallo de send no rompe la transición.

## 2. Backend: botón de asistencia (R3)

- [x] 2.1 Método `confirmAttendance(user, bookingId)`: validaciones (404/409 terminales/ventana 30 min), envío WhatsApp al complejo (gate org), respuesta `{ sent, message }`.
- [x] 2.2 Endpoint `POST /bookings/:id/confirm-attendance` (sin decorador de rol) en `B2bManagementController`.
- [x] 2.3 Spec de `confirmAttendance`: happy path sent:true (org con phone+opt-in), ventana fuera → 409, org sin WhatsApp → sent:false con mensaje.

## 3. Frontend

- [x] 3.1 Helper `buildWhatsAppDeepLink(phone, text)` en `b2bService.ts` + método `confirmAttendance(id)`.
- [x] 3.2 `PaymentView` recibe summary (cancha, día/hora local, monto, bookingId, complejo) y botón "Enviar comprobante por WhatsApp" (oculto si org no tiene teléfono) usando `getOrganization()`.
- [x] 3.3 `RealClientView` pasa el summary al pagar (reserve guarda el booking creado).
- [x] 3.4 Nueva vista `ClientBookingsView` ("Mis turnos") enrutada para `view === 'bookings'`: lista reservas propias, botón "Confirmo asistencia" dentro de la ventana (ticker 30s), feedback del `{ sent, message }`.

## 4. Verificación

- [x] 4.1 `npm run test` (server) completo en verde.
- [x] 4.2 Build de client (tsc) sin errores.
- [ ] 4.3 Smoke: cliente reserva → pago simulado → botón comprobante; staff confirma → log de envío al cliente; dentro de 30 min → botón asistencia → log al complejo.