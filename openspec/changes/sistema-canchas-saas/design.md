## Context

El repositorio es un monorepo npm con un frontend React/Vite y un backend NestJS/TypeORM sobre PostgreSQL. El producto actual expone autenticación JWT, draft, equipos e historial de torneos. La nueva experiencia B2B será una aplicación diferenciada, con backend y base de datos PostgreSQL completamente independientes del juego.

Los usuarios objetivo son propietarios, administradores, operadores y clientes de complejos deportivos. La UI podrá prototiparse en Google Stitch, pero el código integrado debe quedar dividido en páginas, componentes, servicios y stores sustituibles.

## Goals / Non-Goals

**Goals:**

- Introducir un shell de producto B2B con dashboard, contexto de organización y navegación hacia el juego.
- Modelar organizaciones, complejos, canchas, reglas de disponibilidad y reservas con límites claros.
- Exponer endpoints REST versionables y documentados con Swagger.
- Implementar autenticación propia para B2B con organización y rol, sin compartir usuarios ni credenciales con el juego.
- Permitir reservas online únicamente a clientes autenticados y reservas operativas a roles internos autorizados.

**Non-Goals:**

- Implementar pagos, facturación, marketplace público o comisiones en el primer incremento.
- Reescribir el dominio de draft, jugadores, equipos o torneos.
- Definir todavía una identidad visual definitiva de marca.
- Integrar directamente el código exportado por Stitch sin una capa de componentes propia.

## Decisions

- **Aplicación y base independientes:** el B2B tendrá su propio servicio NestJS, variables de conexión y PostgreSQL. No compartirá tablas, usuarios ni migraciones con el juego; el enlace al juego será navegación externa o entre aplicaciones.
- **Separación por módulos de dominio:** crear módulos NestJS `organization`, `facility`, `court`, `availability`, `shift` y `booking`, con servicios y entidades propios.
- **Tenant explícito:** cada recurso B2B tendrá `organizationId` y los servicios validarán pertenencia antes de leer o mutar datos. Cada organización representa un espacio aislado.
- **Autenticación y roles propios:** el JWT B2B pertenecerá a su propia base y soportará `OWNER`, `ADMIN`, `OPERATOR` y `CLIENT`. El servidor impondrá permisos, no el frontend.
- **API REST bajo `/api/v1`:** agrupar los endpoints B2B bajo `/api/v1/auth`, `/api/v1/organizations`, `/api/v1/facilities`, `/api/v1/courts`, `/api/v1/shifts`, `/api/v1/availability` y `/api/v1/bookings`.
- **Disponibilidad y turnos:** almacenar configuración de bloques de 1 o 2 horas, horarios y excepciones; calcular disponibilidad contra reservas y bloqueos en `America/Argentina/Buenos_Aires`.
- **Moneda:** persistir importes monetarios en ARS usando unidades enteras de centavos para evitar errores de punto flotante.
- **Estados de reserva explícitos:** `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` y `NO_SHOW`, con transiciones validadas en el servicio.
- **Frontend por áreas:** la experiencia B2B será una aplicación/ruta diferenciada, con servicios axios y stores propios. Solo tendrá un enlace visible hacia el juego y no compartirá estado de negocio.
- **Integración de diseño:** Stitch será fuente de referencia visual y de layout, no de la arquitectura. Cada vista se convertirá en componentes accesibles y testeables dentro de `apps/client/src`.

## Initial Data Model

La base B2B independiente tendrá como mínimo las siguientes tablas:

- `organizations`: `id`, `name`, `slug`, `status`, `timezone` (por defecto `America/Argentina/Buenos_Aires`), `currency` (por defecto `ARS`), timestamps.
- `users`: `id`, `organization_id`, `email`, `password_hash`, `full_name`, `status`, timestamps. Un usuario pertenece a un único espacio organizacional en el MVP.
- `roles`: `id`, `code` (`OWNER`, `ADMIN`, `OPERATOR`, `CLIENT`), `name`.
- `user_roles`: `user_id`, `role_id`, `organization_id`, claves e índices únicos.
- `facilities`: `id`, `organization_id`, `name`, `address`, `status`, timestamps.
- `courts`: `id`, `facility_id`, `name`, `sport_type`, `capacity`, `status`, `default_price_cents_ars`.
- `shift_rules`: `id`, `court_id`, `weekday`, `start_time`, `end_time`, `duration_hours` (1 o 2), `price_cents_ars`, `active`.
- `shifts`: `id`, `court_id`, `starts_at`, `ends_at`, `price_cents_ars`, `status`; representa un turno reservable generado o administrado por el sistema.
- `availability_blocks`: `id`, `court_id`, `starts_at`, `ends_at`, `reason`, `created_by`.
- `bookings`: `id`, `organization_id`, `court_id`, `shift_id`, `client_user_id`, `status`, `price_cents_ars`, `notes`, timestamps.
- `booking_events`: `id`, `booking_id`, `actor_user_id`, `from_status`, `to_status`, `metadata`, timestamp, para auditoría.

Las claves foráneas e índices deben impedir el acceso cruzado entre organizaciones y evitar dos reservas activas para el mismo turno.

## Essential API Routes

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.
- `POST /api/v1/organizations`, `GET /api/v1/organizations/me`, `PATCH /api/v1/organizations/me`.
- `POST /api/v1/facilities`, `GET /api/v1/facilities`, `PATCH /api/v1/facilities/:id`.
- `POST /api/v1/facilities/:facilityId/courts`, `GET /api/v1/courts`, `PATCH /api/v1/courts/:id`.
- `POST /api/v1/courts/:courtId/shift-rules`, `GET /api/v1/courts/:courtId/shift-rules`.
- `POST /api/v1/courts/:courtId/shifts/generate`, `GET /api/v1/availability?courtId=&from=&to=`.
- `POST /api/v1/courts/:courtId/availability-blocks`, `DELETE /api/v1/availability-blocks/:id`.
- `POST /api/v1/bookings`, `GET /api/v1/bookings`, `GET /api/v1/bookings/:id`.
- `POST /api/v1/bookings/:id/confirm`, `POST /api/v1/bookings/:id/cancel`, `POST /api/v1/bookings/:id/reschedule`, `POST /api/v1/bookings/:id/complete`.

Todas las rutas B2B exigirán JWT B2B. Las rutas administrativas exigirán `OWNER`, `ADMIN` u `OPERATOR`; crear una reserva como cliente exigirá `CLIENT` autenticado y nunca aceptará una identidad anónima.

## Priority Frontend Views and Components

- `login_con_seleccion_de_perfil_sistema_canchas`: pantalla de acceso B2B con selección de perfil y entrada diferenciada para propietario/administrador/operador o cliente.
- `dashboard_operativo_sistema_canchas`: vista para `OWNER`, `ADMIN` y `OPERATOR`, con recaudación diaria en ARS, ocupación, métricas y agenda de canchas reservadas.
- `disponibilidad_de_canchas_sistema_canchas`: vista operativa para consultar calendario, turnos libres, reservados y bloqueados.
- `bandeja_de_reservas_sistema_canchas`: vista operativa para filtrar reservas, revisar estados y ejecutar confirmación, cancelación o reprogramación.
- `pago_y_confirmaci_n_de_turno_cliente`: vista del flujo `CLIENT` para revisar el importe, confirmar el turno y mostrar el estado de pago simulado; no integra pasarela real en el MVP.
- `portal_cliente_reservar_cancha_y_precios`: portal autenticado del cliente para elegir complejo, cancha, fecha, duración de 1/2 horas y precio antes de pasar a confirmación.
- `B2bAppShell`: navegación, organización activa, perfil, logout y enlace visible “El Pizarrón del DT”.
- `OrganizationSetupPage`: alta y configuración inicial del espacio.
- `FacilitiesPage` y `CourtManagementPage`: listado, alta/edición de complejos y canchas.
- `ScheduleRulesPage`: horarios semanales, duración 1/2 horas, precios y bloqueos.
- Componentes compartidos: `RoleGuard`, `OrganizationSwitcher` (reservado para futura multi-organización), `CourtCard`, `ShiftCalendar`, `BookingStatusBadge`, `EmptyState`, `LoadingState` y `ProductLink`.
- Componentes compartidos: `RoleGuard`, `OrganizationSwitcher` (reservado para futura multi-organización), `CourtCard`, `ShiftCalendar`, `BookingStatusBadge`, `EmptyState`, `LoadingState` y `ProductLink`.

Las seis pantallas existentes en `stitch_elite_football_squad_builder/sistema_canchas/` serán la referencia visual del prototipo. Se integrarán primero como recorrido navegable con datos mock y luego se conectarán a estos contratos sin mezclar componentes con el juego.

## Risks / Trade-offs

- [Riesgo] Dos productos tienen despliegues y sesiones diferentes → Mitigación: usar rutas/URLs diferenciadas y presentar el enlace cruzado como navegación explícita, sin asumir SSO.
- [Riesgo] Reservas simultáneas generan doble asignación → Mitigación: transacción PostgreSQL, restricción de solapamiento o bloqueo equivalente y prueba de concurrencia.
- [Riesgo] Reglas horarias complejas retrasan el MVP → Mitigación: comenzar con horarios semanales, bloqueos manuales y zona horaria por complejo.
- [Riesgo] La base B2B requiere operación propia → Mitigación: variables de entorno, migraciones, backups y health checks independientes.

## Migration Plan

1. Provisionar la base PostgreSQL B2B, credenciales y pipeline de migraciones independiente.
2. Crear entidades, roles, autenticación y endpoints sin modificar el backend del juego.
3. Publicar el prototipo Stitch con datos semilla de una organización de prueba.
4. Integrar API real de disponibilidad y reservas con pruebas de concurrencia.
5. Habilitar el enlace visible hacia la aplicación del juego y validar que ambas experiencias sigan aisladas.
6. Si fuera necesario revertir, retirar el despliegue B2B o desactivar sus rutas sin alterar la base del juego.

## Open Questions

- ¿La experiencia B2B se desplegará como dominio propio o como aplicación bajo otro prefijo de URL?
- ¿Se incorporarán pagos online después del MVP y qué proveedor se evaluará?
- ¿Qué política de cancelación y reembolso aplicará cada organización?
- ¿Cómo se aprovisionará la base independiente por ambiente y por despliegue?