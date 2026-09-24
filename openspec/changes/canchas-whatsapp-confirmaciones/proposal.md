# Confirmaciones y comprobantes por WhatsApp (#34)

## Problem Statement

El Sistema Canchas ya gestiona reservas (PENDING→CONFIRMED) con notificaciones
in-app, y el paso de pago es simulado. Los clientes y el staff del complejo
operan hoy sin contacto directo de WhatsApp, pese a que el contacto ya se puede
cargar en el perfil (#37).

Faltan las tres conexiones con WhatsApp que dan valor al flujo real:

1. **Comprobante tras el pago**: el cliente que acaba de pagar no tiene cómo
   mandarle el comprobante al dueño.
2. **Confirmación automática**: cuando el dueño confirma una reserva, el cliente
   no recibe aviso fuera de la app.
3. **Avísame 30' antes**: cerca del turno no hay forma de confirmar asistencia y
   avisar al complejo.

## Proposal

Agregar la capa de confirmaciones/comprobantes por WhatsApp sobre la
infraestructura de mensajería ya creada (#37):

- **R1 · Comprobante por deep-link**: en la pantalla de confirmación de pago, un
  botón "Enviar comprobante por WhatsApp" abre `wa.me/<teléfono del complejo>`
  con el comprobante de la reserva ya redactado (solo si el complejo cargó
  teléfono). Es 100 % frontend: `MESSAGING_PROVIDER=log` no interviene.
- **R2 · Confirmación automática al cliente**: al confirmar una reserva
  (`POST /bookings/:id/confirm`), el sistema envía WhatsApp al cliente reservante
  si tiene teléfono + opt-in (gate `canSendWhatsApp`). El envío es best-effort:
  un fallo jamás revierte la confirmación.
- **R3 · Botón de asistencia a 30 minutos**: en "Mis turnos" (clientes), cada
  reserva activa cuyo horario arranca dentro de los próximos 30 minutos muestra
  "Confirmo asistencia". El servidor valida la ventana (0 ≤ inicio − ahora ≤ 30
  min; fuera → 409) y envía WhatsApp al complejo avisando la asistencia,
  respondiendo `{ sent }` para que la UI confirme.

## Out of Scope

- Pasarela de pagos real: el comprobante se arma con la reserva (el pago sigue
  siendo simulado). Cuando exista una pasarela, el texto del comprobante se
  alimenta del registro de pago sin tocar esta arquitectura.
- Proveedor de WhatsApp real: los envíos R2/R3 pasan por `MessagingService`
  (hoy `log`); con un adaptador real llegarán al teléfono sin cambios de código.
- Marcar NO_SHOW / COMPLETED automáticamente al confirmar asistencia.