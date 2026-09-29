## 1. Modelo y migración

- [x] 1.1 Agregar configuración de anticipaciones WhatsApp a B2bOrganizationEntity con valores iniciales de 1440 y 60 minutos.
- [x] 1.2 Crear entidad de entrega idempotente por bookingId y minutesBefore, con estado, marcas de tiempo y migración reversible.
- [x] 1.3 Registrar entidad y migración en el datasource B2B.

## 2. Configuración de organización

- [ ] 2.1 Validar y persistir anticipaciones desde PATCH /api/v1/organizations/me para staff autorizado.
- [ ] 2.2 Exponer y tipar la configuración en b2bService.
- [ ] 2.3 Agregar controles para activar, eliminar y guardar anticipaciones en Horarios y Configuración.

## 3. Procesador de recordatorios

- [ ] 3.1 Procesar periódicamente reservas activas y turnos próximos, respetando cada anticipación configurada.
- [ ] 3.2 Validar consentimiento al momento del envío y omitir reservas cerradas o turnos iniciados.
- [ ] 3.3 Persistir estado por combinación de reserva y anticipación, con reintentos y protección ante ejecuciones concurrentes.
- [ ] 3.4 Usar MessagingService y registrar claramente las entregas simuladas del proveedor log.

## 4. Reloj del dashboard

- [ ] 4.1 Mostrar hora y fecha en vivo en la zona horaria de la organización.
- [ ] 4.2 Agregar estilo responsive coherente con la cabecera del dashboard.

## 5. Despliegue local

- [ ] 5.1 Documentar el estado simulado y cómo configurar anticipaciones.
- [ ] 5.2 Dejar indicada la migración B2B pendiente de aplicar; no ejecutarla sobre una base de datos sin autorización expresa.
