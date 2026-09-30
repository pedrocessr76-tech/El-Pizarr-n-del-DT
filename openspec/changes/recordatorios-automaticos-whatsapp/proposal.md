## Why

La issue #34 pedía recordatorios automáticos por WhatsApp. El único proveedor posible hoy (`Meta Cloud API`) es de pago: no hay licencia gratuita y las plantillas *utility* se cobran por mensaje entregado (USD 0,026 a Argentina). Los dos atajos no oficiales (`Baileys`, `WAHA`) son gratuitos pero violan los términos de WhatsApp, pueden terminar con el número baneado y exigen un proceso siempre vivo, que el plan gratuito de Render —donde corre la API— no puede sostener.

Además, el diseño anterior asumía un único canal con un solo clic en el proveedor. La operación real de una cancha necesita dos tiempos distintos: **avisar con antelación** (el cliente se organiza, no llega) y **avisar en el momento** (el cliente está por salir, hay que confirmarle ya). Un solo canal no cubre bien ninguno de los dos.

## What Changes

- **Reemplazar el envío automático de WhatsApp por un modelo de dos canales**:
  - **Email automático** para las anticipaciones largas (por defecto 24 h antes). Sale por SMTP contra un mailbox propio, sin costo ni dependencia externa, y con el dashboard cerrado.
  - **WhatsApp manual** para las anticipaciones cortas (por defecto 30 min antes). El servidor no envía: deja el aviso *pendiente* y el staff lo despacha con un toque desde el dashboard, abriendo `wa.me` con el mensaje pre-cargado.
- **Generalizar `MessageProvider`** de WhatsApp a multicanal, de modo que `log`, `smtp` y (a futuro) `meta-cloud` o `baileys` se enchufen sin tocar a los consumidores. La selección de proveedor pasa a ser por canal.
- **Configuración por organización con dos listas de anticipaciones** independientes: `emailReminderIntervalsMinutes` y `whatsappReminderIntervalsMinutes`.
- **Identificar cada recordatorio por `(reserva, canal, anticipación)`**, para que un mismo aviso pueda dispararse por los dos canales sin colisionar en la clave única.
- **Nuevo panel "Avisos pendientes"** en el dashboard del staff: lista los turnos próximos que necesitan un aviso de WhatsApp, con el teléfono y el texto ya armados, y marca el aviso como enviado al hacer clic.
- **Mantener el reloj en vivo** del dashboard, ya implementado.
- Sin opt-in adicional para email: el recordatorio de un turno que el cliente reservó es comunicación transaccional, no comercial, y la Ley 25.326 sólo exige consentimiento para las comunicaciones comerciales.

## Capabilities

### New Capabilities

- `booking-reminder-channels`: configuración de anticipaciones por canal y enrutado de cada recordatorio a email automático o WhatsApp manual.
- `email-booking-reminders`: envío automático de recordatorios por email con deduplicación, consentimiento y reintentos.
- `pending-whatsapp-alerts`: panel de avisos pendientes de WhatsApp que el staff despacha con un toque.
- `dashboard-clock`: reloj en vivo del dashboard operativo en la zona horaria del complejo.
- `data-model`: persistencia de la configuración organizacional y control de envíos ya procesados.

### Modified Capabilities
<!-- No se modifican requisitos existentes. -->

## Impact

- Backend B2B: migración TypeORM (columna de anticipaciones de email y clave única por canal), generalización de `messaging/`, nuevo `SmtpMessageProvider`, processor bifurcado por canal y dos endpoints nuevos de avisos.
- Frontend B2B: panel "Avisos pendientes" en el dashboard, `ReminderSettings` dividido en dos grupos, y tipos del cliente.
- Mensajería: se conserva el proveedor intercambiable; la entrega real de WhatsApp sigue sin implementarse y ahora queda explícitamente fuera del camino automático.
- Requisito operativo: configurar `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` para que salgan los emails; sin eso el canal cae al proveedor `log`.
