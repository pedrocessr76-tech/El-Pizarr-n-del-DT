## Context

La issue #34 pide reloj en el dashboard, anticipaciones configurables y recordatorios a los clientes. El diseño anterior suponía que el envío automático sería por WhatsApp a través del `MessageProvider` existente, con el proveedor real resuelto más adelante. Esa suposición no se sostiene: el único proveedor oficial (`Meta Cloud API`) cobra por mensaje entregado, y los no oficiales exigen un proceso siempre vivo que el plan gratuito de Render —donde corre la API— no puede mantener.

Lo que sí está resuelto y no hay que rehacer: la entidad de entregas idempotente, el ciclo periódico de un minuto, la máquina de estados por anticipación, el reloj del dashboard, los controles de anticipación, el teléfono y el consentimiento del cliente, y la interfaz `MessageProvider` con su proveedor `log`.

Sobre esa base hay que decidir el reparto entre dos canales según el momento en que el aviso se vuelve útil.

## Goals / Non-Goals

**Goals:**
- Avisar con antelación por un canal automático, sin costo y sin riesgo de baneo.
- Avisar en el momento inmediato con un toque del staff, sin depender de ningún proveedor de WhatsApp.
- Mantener la proveedoridad: que enchufar un proveedor real más adelante no obligue a tocar a los consumidores.
- Mostrar en el dashboard qué avisos de WhatsApp quedaron sin despachar.

**Non-Goals:**
- Enviar WhatsApp automáticamente desde el servidor. Queda explícitamente fuera de alcance.
- Comprar o contratar Meta Cloud API, ni configurar plantillas aprobadas.
- Perseguir entregabilidad de marketing o campañas. Sólo recordatorios transaccionales.
- Agregar opt-in de email: es comunicación transaccional sobre una reserva que el propio cliente hizo.

## Decisions

### Reparto de canales

El criterio es **tiempo de reacción**: cuánto le sirve al cliente al aviso antes de su turno.

- **Anticipaciones largas (por defecto 1440 min = 24 h) → email automático.** El cliente puede actuar sin costo (confirmar, reprogramar, organizarse). Es un canal que el servidor puede usar solo, con el dashboard cerrado, y por el que se puede seguir su entrega.
- **Anticipaciones cortas (por defecto 30 min) → WhatsApp manual.** A 30 minutos la única acción posible es ir; el valor está en el contacto directo y en que el staff lo dispacha con el contexto del turno a la vista. El autoenvío no aportaría nada y sí un riesgo de baneo.

El mismo criterio de tiempo es el que respeta la franja gratuita de Meta si algún día se migra: las plantillas *utility* de 24 h son más baratas que las de categoría marketing, pero siguen siendo de pago.

### Generalizar `MessageProvider` a multicanal

`MessageProvider.send(message)` ya tenía la forma correcta; lo único específico de WhatsApp eran los nombres de los tipos y el significado de `to`. Se renombran a `ChannelMessage`/`DeliveryResult` y se agrega `channel: 'email' | 'whatsapp'` más un `subject` opcional.

`MessagingModule` pasa a exponer un registro canal → proveedor, resuelto desde el entorno:

- `MESSAGING_PROVIDER_WHATSAPP` (por defecto `log`)
- `MESSAGING_PROVIDER_EMAIL` (por defecto `log`)

`MessagingService` expone `sendWhatsApp()` y `sendEmail()`. Los consumidores no cambian de forma salvo por el nombre del método, y el proveedor real de WhatsApp sigue siendo un `MessageProvider` más.

### Email por SMTP

Se usa `nodemailer` contra un mailbox propio. Es la vía que ya está operativa hoy sin comprar nada: un Gmail con clave de aplicación, o el correo del negocio. La alternativa "gratuita" con mejor entregabilidad (Resend, 3.000 emails/mes) exige verificar un dominio propio, que el proyecto todavía no tiene — está en `*.onrender.com`.

El transporte queda encapsulado en `SmtpMessageProvider`, así que migrar a Resend más adelante es cambiar un adaptador, no tocar el processor. Si falta `SMTP_HOST`, el canal cae a `log` y el comportamiento es idéntico al actual: se registra como simulado.

### Consentimiento

El email no pide opt-in nuevo. La Ley 25.326 exige consentimiento para las comunicaciones comerciales; el recordatorio de un turno reservado es transaccional. El cliente ya dio su email al registrarse y lo usó para reservar. `canSendWhatsApp` se mantiene intacto para el canal de WhatsApp, que sí es un contacto iniciado por la organización.

### Identidad de cada recordatorio

La clave única pasa de `(bookingId, minutesBefore)` a `(bookingId, channel, minutesBefore)`. Sin esto, un mismo aviso configurado en los dos canales chocaría y uno de los dos se perdería. La entidad gana una columna `channel` y una migración reemplaza el índice.

### Estados

Se agrega `AWAITING_MANUAL` al circuito, distinto de `SENT`/`FAILED`/`SKIPPED`:

- El processor **reclama** el recordatorio de WhatsApp igual que los demás, para no repetirlo en cada ciclo, pero **no llama al proveedor**: lo deja en `AWAITING_MANUAL`.
- El panel del staff lista los `AWAITING_MANUAL` cuyo turno todavía no empezó.
- Al hacer clic en "Abrir WhatsApp" el cliente llama a `POST /reminders/:id/sent` y el registro pasa a `SENT`.

Que el clic marque `SENT` es una Best-effort: el servidor no puede saber si el staff realmente apretó enviar en su teléfono. Se acepta porque el objetivo es evitar la reiteración en el panel, no llevar un acuse de recibo real.

### Reintentos

Sólo se reintentan los `FAILED`. Un `AWAITING_MANUAL` no vence por tiempo: si el staff nunca lo despacha, el aviso simplemente deja de aparecer cuando el turno empieza, y la reserva se cancela o se reprograma por el flujo normal.

## Risks / Trade-offs

- **El aviso de 30 min depende de que haya alguien mirando el dashboard.** Es el compromiso explícito del canal manual. Mitigación: el panel lo muestra en el dashboard operativo, que es donde el staff ya está para atender la consulta.
- **SMTP desde un mailbox personal tiene entregabilidad limitada** (llega a spam, cuota diaria). Aceptable a escala de cancha. Se mitiga con remitente consistente y texto plano.
- **Bajar el número de WhatsApp baneado a cero** es la ganancia principal: el sistema nunca abre una sesión automatizada de WhatsApp.
- **Un fallo de email no tiene reintento aggressive**: `SENT`/`FAILED` se registran y las fallidas quedan elegibles, igual que antes.
- **El panel depende del deep link `wa.me`**, que exige que el staff tenga WhatsApp instalado. Si no, el enlace no abre nada; la UI debe mostrar el teléfono y el texto para poder copiarlo a mano.

## Migration Plan

1. Agregar `emailReminderIntervalsMinutes` a `b2b_organizations`, con default `[1440]`, y llevar `whatsappReminderIntervalsMinutes` a `[30]`.
2. Agregar `channel` a `b2b_booking_reminders` y reemplazar el índice único por `(bookingId, channel, minutesBefore)`.
3. Backfill: los registros existentes que estaban en estado terminal se completan con `channel = 'whatsapp'`, que es el único canal que procesaba el sistema.
4. Desplegar backend y frontend. Con `SMTP_*` sin configurar, los emails quedan simulados exactamente como antes.
5. Para revertir, el `down()` de la migración restaura el índice anterior, borra `channel` y elimina la columna de email.

## Open Questions

- El número de enlaces que abre `wa.me` en el dashboard es la métrica para decidir si el canal manual rinde; si rindiera mal, el siguiente paso sería un proveedor real de email transaccional con plantillas en vez de volver a WhatsApp automático.
- Cuando exista dominio propio, evaluar migrar el transporte de `SmtpMessageProvider` a Resend sin cambiar el contrato.
