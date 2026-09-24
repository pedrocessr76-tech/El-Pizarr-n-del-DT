# WhatsApp: confirmaciones y comprobantes

## Requirements

### Comprobante tras el pago (deep-link)

- **R1.1** El cliente que completa el paso de pago (simulado) MUST ver un botón
  "Enviar comprobante por WhatsApp" cuando su complejo tiene `whatsappPhone`
  configurado.
- **R1.2** El botón MUST abrir `https://wa.me/<digitos sin +>?text=<mensaje>`
  con un comprobante pre-cargado: nombre del complejo, cancha, fecha y hora
  local del turno, monto y referencia de la reserva.
- **R1.3** Si el complejo no tiene `whatsappPhone`, el botón MUST estar oculto
  (el cliente siempre puede reservar; el envío del comprobante es opcional).

### Confirmación automática al cliente

- **R2.1** Cuando el staff confirma una reserva (`POST /bookings/:id/confirm`),
  el sistema MUST enviar WhatsApp al cliente reservante si y solo si cumple el
  gate `canSendWhatsApp(whatsappPhone, whatsappOptIn)` (vía `MessagingService`,
  kind `confirmation`).
- **R2.2** El cuerpo MUST incluir cancha, fecha y hora local del turno y el
  nombre del complejo.
- **R2.3** El envío MUST ser best-effort: un error de mensajería registra un log
  y NO modifica el estado de la reserva (la confirmación ya persiste).

### Botón de asistencia a 30 minutos

- **R3.1** El cliente MUST ver en "Mis turnos" un botón "Confirmo asistencia"
  para cada reserva activa (PENDING o CONFIRMED) cuyo turno comience dentro de
  la ventana `0 ≤ inicio − ahora ≤ 30 min`.
- **R3.2** El endpoint `POST /bookings/:id/confirm-attendance` MUST:
  - validar pertenencia (cliente dueño de la reserva, o staff de la org; si no →
    404),
  - rechazar con 409 si el turno está fuera de la ventana o ya comenzó,
  - rechazar reservas en estado terminal (CANCELLED/COMPLETED/NO_SHOW),
  - enviar WhatsApp al complejo (org `whatsappPhone` + `whatsappOptIn`) con el
    aviso de asistencia (kind `reminder`) si aplica,
  - responder `{ sent: boolean }`.
- **R3.3** Con el complejo sin WhatsApp configurado, MUST responder
  `{ sent: false }` con mensaje explicativo (HTTP 200, no error).
- **R3.4** Tras confirmar, la UI MUST mostrar el resultado: "El complejo fue
  avisado" o "El complejo aún no configuró WhatsApp" y deshabilitar el botón
  para esa reserva.

## Scenarios / Examples

- El complejo Los Amigos (org phone `+54911...`, opt-in on) recibe de Martín una
  reserva de las 19:00 en Cancha 1. El staff la confirma → el sistema envía a
  Martín: "Tu reserva en Cancha 1 (Fútbol 7) del hoy 19:00 fue confirmada por
  Complejo Los Amigos."
- A las 18:35 Martín abre "Mis turnos": ve la reserva de las 19:00 con "Confirmo
  asistencia". Lo toca → el sistema envía al dueño: "Martín confirmó asistencia
  al turno de las 19:00 en Cancha 1." y la UI muestra "El complejo fue avisado."
- Sin org phone: el botón de comprobante no aparece y al tocar "Confirmo
  asistencia" la UI informa que el complejo no configuró WhatsApp.