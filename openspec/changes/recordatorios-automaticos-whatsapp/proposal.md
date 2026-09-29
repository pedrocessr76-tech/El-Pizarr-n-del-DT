## Why

Los complejos necesitan recordar automáticamente a sus clientes los turnos próximos, sin depender de que un operador esté mirando el dashboard. El dashboard también debe mostrar la hora actual en la zona horaria del complejo para que el equipo pueda seguir la jornada.

## What Changes

- Mostrar un reloj en vivo en el dashboard operativo, usando la zona horaria de la organización.
- Permitir configurar anticipaciones de recordatorio por organización; los valores iniciales serán 24 horas y 1 hora antes del turno.
- Procesar los recordatorios en el servidor aunque el dashboard esté cerrado, respetando teléfono y consentimiento WhatsApp del cliente.
- Enviar mediante el `MessagingService` existente; mientras `MESSAGING_PROVIDER=log`, indicar claramente que el envío está simulado.
- Evitar duplicados al procesar un mismo recordatorio y omitir reservas canceladas o cerradas.

## Capabilities

### New Capabilities

- `whatsapp-booking-reminders`: configuración y envío automático de recordatorios previos a los turnos.
- `dashboard-clock`: reloj en vivo del dashboard operativo en la zona horaria del complejo.
- `data-model`: persistencia de la configuración organizacional y control de envíos ya procesados.

### Modified Capabilities
<!-- No se modifican requisitos existentes. -->

## Impact

- Backend B2B: migración TypeORM, entidades, configuración de recordatorios, proceso periódico y consumidor del servicio de mensajería.
- Frontend B2B: widget de reloj y controles de anticipación en la configuración operativa.
- Mensajería: conserva el proveedor intercambiable existente; la entrega real requiere configurar posteriormente un proveedor real.
