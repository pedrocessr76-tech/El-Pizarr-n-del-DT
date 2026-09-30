## 1. Modelo y migración

- [x] 1.1 Agregar configuración de anticipaciones a B2bOrganizationEntity.
- [x] 1.2 Crear entidad de entrega idempotente por reserva y anticipación, con estado, marcas de tiempo y migración reversible.
- [x] 1.3 Registrar entidad y migración en el datasource B2B.
- [x] 1.4 Agregar `emailReminderIntervalsMinutes` (default `[1440]`) y llevar `whatsappReminderIntervalsMinutes` a `[30]`.
- [x] 1.5 Agregar la columna `channel` a la entidad de entregas y migrar el índice único a `(bookingId, channel, minutesBefore)`.
- [x] 1.6 Backfill: asociar a `whatsapp` las entregas existentes y probar el `down()`.
- [x] 1.7 Agregar el estado `AWAITING_MANUAL` al circuito de la entidad.

## 2. Mensajería multicanal

- [x] 2.1 Renombrar los tipos a `ChannelMessage`/`DeliveryResult` y agregar `channel` y `subject` opcional.
- [x] 2.2 Convertir `MessagingModule` en un registro canal → proveedor resuelto por entorno, con `log` como default de ambos canales.
- [x] 2.3 Exponer `sendWhatsApp()` y `sendEmail()` desde `MessagingService`.
- [x] 2.4 Implementar `SmtpMessageProvider` con `nodemailer`, con transporte perezoso y sin conexiones al importar.
- [x] 2.5 Declarar las variables `SMTP_*` y `MESSAGING_PROVIDER_EMAIL` en `.env.example` y en `render.yaml`.
- [x] 2.6 Mantener `LogMessageProvider` funcionando para los dos canales.

## 3. Configuración por canal

- [x] 3.1 Validar y persistir las dos listas desde `PATCH /api/v1/organizations/me` para staff autorizado.
- [x] 3.2 Exponer y tipar la configuración en `b2bService`.
- [x] 3.3 Agregar controles de anticipación separados por canal en Horarios y Configuración.
- [x] 3.4 Derivar el canal de cada recordatorio a partir de las dos listas de la organización.

## 4. Procesador de recordatorios

- [x] 4.1 Procesar periódicamente reservas activas y turnos próximos, respetando cada anticipación configurada.
- [x] 4.2 Omitir reservas cerradas o turnos iniciados.
- [x] 4.3 Persistir estado por combinación de reserva y anticipación, con reintentos y protección ante ejecuciones concurrentes.
- [x] 4.4 Usar MessagingService y registrar claramente las entregas simuladas del proveedor log.
- [x] 4.5 Enviar por email las anticipaciones del canal de email, sin exigir opt-in.
- [x] 4.6 Dejar en `AWAITING_MANUAL` las anticipaciones del canal de WhatsApp, sin llamar al proveedor.
- [x] 4.7 No reintentar los avisos que esperan al staff.
- [x] 4.8 Agregar pruebas del processor bifurcado por canal.

## 5. Panel de avisos pendientes

- [x] 5.1 Agregar `GET /api/v1/reminders/pending` para staff, con teléfono, cancha, hora y texto armado.
- [x] 5.2 Agregar `POST /api/v1/reminders/:id/sent` para confirmar el despacho.
- [x] 5.3 Crear el componente de panel y montarlo en el dashboard del staff.
- [x] 5.4 Abrir `wa.me` con el mensaje pre-cargado y confirmar el despacho al hacer clic.
- [x] 5.5 Permitir copiar teléfono y texto cuando el enlace no pueda abrirse.
- [x] 5.6 Agregar pruebas de los dos endpoints.

## 6. Reloj del dashboard

- [x] 6.1 Mostrar hora y fecha en vivo en la zona horaria de la organización.
- [x] 6.2 Agregar estilo responsive coherente con la cabecera del dashboard.

## 7. Despliegue y documentación

- [x] 7.1 Documentar la configuración SMTP y cómo verificar que el email sale.
- [x] 7.2 Documentar por qué WhatsApp es manual y qué proveedor real haría falta para automatizarlo.
- [x] 7.3 Dejar indicada la migración B2B pendiente de aplicar; no ejecutarla sobre una base de datos sin autorización expresa.
- [x] 7.4 Correr build, typecheck y tests de servidor y cliente.
