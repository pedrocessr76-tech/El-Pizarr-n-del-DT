## Context

La issue #34 pide un reloj en el dashboard, anticipaciones configurables y recordatorios automáticos a clientes. El dashboard ya recibe la zona horaria de la organización. El B2B ya tiene teléfono y consentimiento por usuario, un `MessagingService` y un proveedor `log` que simula la entrega; no hay planificador instalado.

## Goals / Non-Goals

**Goals:**
- Mostrar hora y fecha local del complejo en el dashboard.
- Guardar las anticipaciones de WhatsApp en la organización; iniciar con 1440 y 60 minutos antes del turno.
- Procesar recordatorios desde el servidor con el dashboard cerrado, validar opt-in al enviar y evitar duplicar cada combinación reserva/anticipación.
- Comunicar en la interfaz y los logs cuándo el proveedor `log` simula el envío.

**Non-Goals:**
- Implementar o contratar un proveedor real de WhatsApp en esta etapa.
- Enviar a clientes sin teléfono y consentimiento explícito.
- Aplicar recordatorios a reservas canceladas, completadas o no presentadas.

## Decisions

- Guardar la lista de minutos de anticipación como JSONB en `b2b_organizations`, con validación de enteros positivos y un máximo acotado.
- Usar una entidad de entregas con índice único por `bookingId` y `minutesBefore` para deduplicar ejecuciones y conservar su estado.
- Un servicio NestJS inicia un ciclo periódico de un minuto y busca reservas activas cuyos avisos ya vencieron y cuyo turno todavía no empezó. Los avisos atrasados por una caída se procesan al recuperar el servicio.
- Reclamar cada entrega dentro de una transacción y volver a intentar las fallidas; la restricción única permite varias instancias sin crear trabajos duplicados.
- Validar el teléfono y el consentimiento del cliente inmediatamente antes de llamar a `MessagingService`; registrar como omitido el destinatario que no cumpla la regla.
- La configuración y mensajes usan el `MessagingService` existente. Con `MESSAGING_PROVIDER=log`, los mensajes quedan simulados y la UI nunca debe presentarlos como entregados por WhatsApp.
- El reloj se actualiza localmente cada segundo y formatea el instante con `Intl.DateTimeFormat` y la zona horaria de la organización.

## Risks / Trade-offs

- El proveedor actual no entrega mensajes reales → etiquetar el modo simulado; la integración real queda separada y requiere credenciales de proveedor.
- Un proceso puede detenerse durante el envío → conservar estados y reintentar entregas no finalizadas; un fallo justo después de la entrega externa puede causar un reintento.
- La consulta periódica carga datos de reservas próximas → limitar candidatos a reservas activas y turnos futuros y mantener índices en organización/estado y fecha de turno.
- Las zonas horarias afectan solo la visualización del reloj; las anticipaciones se calculan sobre instantes UTC del turno.

## Migration Plan

1. Agregar la columna de configuración con valores iniciales de 24 h y 1 h y crear la tabla de entregas con su índice único.
2. Desplegar backend y frontend; mientras la configuración siga en `log`, no salen mensajes externos.
3. Para revertir, ejecutar la migración down que elimina la tabla de entregas y la columna de configuración.

## Open Questions

- La conexión del proveedor real se configura en una etapa posterior.
