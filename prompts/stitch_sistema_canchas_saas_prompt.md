# Prompt para Google Stitch: Sistema Canchas

Diseña una aplicación web B2B SaaS llamada **Sistema Canchas**, orientada a propietarios, administradores y operadores de complejos deportivos de fútbol en Argentina.

## Objetivo del prototipo

Crear un prototipo navegable, responsive y listo para validar con usuarios. La pantalla inicial debe ser un dashboard operativo, no una landing de marketing. El producto debe transmitir control, claridad y velocidad para gestionar canchas y reservas durante una jornada de trabajo real.

No diseñes todavía pagos, facturación, marketplace, comisiones ni reservas anónimas. Todas las reservas del cliente requieren cuenta e inicio de sesión.

## Dirección visual

- Estética deportiva premium, profesional y enérgica, pero sobria.
- Evitar el aspecto de plantilla genérica de dashboard y evitar purple-on-white.
- Usar una paleta con verde césped profundo como color de acción, azul petróleo o grafito para navegación, blanco cálido para superficies y ámbar para alertas o reservas pendientes.
- Crear variables visuales consistentes para color, tipografía, espaciado, bordes y estados.
- Usar una tipografía sans-serif expresiva y legible, con jerarquía clara para datos operativos.
- Tarjetas con radio máximo de 8px, sombras suaves y bordes discretos.
- Usar iconos reconocibles en botones de acción y tooltips en iconos no obvios.
- Evitar gradientes morados, orbes decorativos, fondos bokeh, exceso de tarjetas anidadas y hero sections de marketing.
- Utilizar imágenes reales o bitmap solo cuando ayuden a representar un complejo o una cancha; no usar imágenes oscuras, abstractas o atmosféricas como contenido principal.
- Añadir animaciones breves de entrada y cambios de estado, sin animaciones decorativas excesivas.

## Arquitectura de navegación

Diseña una experiencia B2B diferenciada de **El Pizarrón del DT**.

El shell principal debe incluir:

- Logo y nombre “Sistema Canchas”.
- Selector del espacio organizacional actual, aunque en el MVP cada usuario pertenezca a una sola organización.
- Navegación lateral o superior con: Dashboard, Complejos y canchas, Horarios, Disponibilidad, Reservas y Configuración.
- Perfil del usuario, rol visible de forma discreta y acción de cerrar sesión.
- Un enlace visible llamado **“Ir a El Pizarrón del DT”**, que representa el acceso cruzado al producto original.

No mezclar en la interfaz la navegación interna del juego con la navegación B2B. El enlace al juego debe sentirse como cambio de producto.

## Roles y permisos que debe reflejar la UI

Diseña estados para estos roles:

- **Propietario:** acceso completo a la organización.
- **Administrador:** gestión operativa y configuración autorizada.
- **Operador:** gestión diaria de turnos, bloqueos y reservas.
- **Cliente:** consulta de disponibilidad y creación de reservas con cuenta autenticada.

La interfaz debe ocultar o deshabilitar acciones que el rol no puede ejecutar. La seguridad real será validada por el backend; Stitch solo debe representar correctamente los estados visuales.

## Las seis pantallas de Stitch y su distribución por rol

Usa como referencia visual exacta los seis diseños ubicados en:
`stitch_elite_football_squad_builder/sistema_canchas/`.

### Flujo compartido

#### 1. `login_con_seleccion_de_perfil_sistema_canchas`

Esta es la pantalla de login principal de Sistema Canchas. Debe permitir seleccionar el perfil antes de iniciar sesión:

- Propietario.
- Administrador.
- Operador.
- Cliente.

La selección de perfil solo cambia la experiencia y los permisos visibles; el backend seguirá validando el rol real del JWT. No crear una sesión de invitado para reservar.

## Vistas prioritarias

### 2. Dashboard operativo para propietarios y operadores

Usa `dashboard_operativo_sistema_canchas` para los roles `OWNER`, `ADMIN` y `OPERATOR`.

Debe mostrar con mucha claridad:

- Recaudación del día en ARS.
- Reservas confirmadas, pendientes y canceladas.
- Ocupación por cancha.
- Ingresos estimados y cantidad de turnos vendidos.
- Calendario o agenda con las canchas reservadas.
- Cliente, cancha, horario, duración, estado y monto de cada reserva.
- Acciones rápidas para bloquear horario, crear reserva y ver disponibilidad.

Esta pantalla debe sentirse como el centro de control diario del complejo, no como una landing comercial.

### 3. Disponibilidad operativa de canchas

Usa `disponibilidad_de_canchas_sistema_canchas` para `OWNER`, `ADMIN` y `OPERATOR`.

- Mostrar las canchas en filas o columnas y los turnos en una grilla/calendario.
- Diferenciar visualmente libre, reservado, pendiente, bloqueado y fuera de horario.
- Permitir filtrar por fecha, cancha y complejo.
- Mostrar duración de 1 o 2 horas, precio en ARS y cliente cuando corresponda.
- Permitir que los roles internos creen bloqueos o abran el detalle de una reserva.

### 4. Bandeja de reservas para el equipo operativo

Usa `bandeja_de_reservas_sistema_canchas` para `OWNER`, `ADMIN` y `OPERATOR`.

- Tabla o lista densa con filtros por fecha, cancha, cliente y estado.
- Estados `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` y `NO_SHOW`.
- Recaudación total y subtotales por estado.
- Detalle de reserva con historial de eventos.
- Acciones de confirmar, cancelar, reprogramar y completar según rol.

### 5. Portal cliente para reservar

Usa `portal_cliente_reservar_cancha_y_precios` exclusivamente para `CLIENT` autenticado.

- Elegir complejo, cancha, fecha y turno.
- Elegir duración de 1 o 2 horas.
- Ver precio final en ARS antes de confirmar.
- Ver disponibilidad en tiempo real/mock.
- Revisar resumen del turno y datos del cliente.
- Mostrar sus reservas activas y anteriores.
- Si no hay sesión, enviar a login/registro; nunca permitir reservar anónimamente.

### 6. Pago y confirmación del turno

Usa `pago_y_confirmaci_n_de_turno_cliente` como paso final del flujo cliente.

- Mostrar cancha, fecha, hora, duración y precio en ARS.
- Mostrar un estado de pago/confirmación simulado para el prototipo.
- Mostrar estados de carga, éxito, error y turno ya ocupado.
- Permitir volver al portal o consultar la reserva creada.
- No diseñar todavía una pasarela real ni almacenar datos de tarjetas.

### 7. Login y registro B2B

- Login con email y contraseña.
- Registro inicial de organización con nombre, slug, nombre completo, email y contraseña del propietario.
- Mensajes de validación, error, carga y éxito.
- Mostrar que se trata de Sistema Canchas, no del juego.
- No incluir acceso de invitado para reservar.

Diseña el acceso separado con:

- Fecha actual en formato argentino.
- Resumen de reservas del día.
- Turnos libres, confirmados, pendientes y cancelados.
- Ocupación de canchas.
- Ingresos estimados en pesos argentinos, usando formato `ARS`.
- Acciones rápidas: Nueva reserva, Bloquear horario, Administrar canchas.
- Agenda del día con cancha, hora, cliente, estado y precio.
- Estados vacíos y skeleton de carga.

Usa datos de demostración realistas de un complejo deportivo argentino.

### 8. Complejos y canchas

- Listado de complejos con nombre, dirección, estado y cantidad de canchas.
- Detalle de un complejo.
- Listado de canchas con nombre, tipo, capacidad, estado y precio base.
- Formularios de alta y edición.
- Estados activo/inactivo.
- Acciones contextuales para editar y administrar horarios.

### 9. Horarios y configuración

- Configuración semanal por cancha.
- Selector de duración de turno limitado a **1 hora** o **2 horas**.
- Hora de inicio, hora de finalización y precio en ARS.
- Zona horaria mostrada como `America/Argentina/Buenos_Aires`.
- Bloqueos manuales con motivo.
- Confirmación antes de eliminar o bloquear.

### 10. Flujo del cliente autenticado

- El cliente debe iniciar sesión antes de reservar.
- El recorrido recomendado es: login → portal cliente → pago/confirmación → mis reservas.
- Si no está autenticado, mostrar una pantalla de acceso o registro, nunca una reserva anónima.

## Componentes reutilizables

Diseña componentes modulares que puedan implementarse luego en React:

- `B2bAppShell`
- `Sidebar` o `TopNavigation`
- `OrganizationContext`
- `RoleBadge`
- `MetricCard`
- `CourtCard`
- `ShiftCalendar`
- `ShiftStatusBadge`
- `BookingTable`
- `BookingDetailPanel`
- `BookingStatusBadge`
- `DateRangeFilter`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ConfirmDialog`
- `ProductLink`

Cada componente debe tener estados normal, hover, focus, disabled, loading, empty y error cuando corresponda.

## Datos de demostración

Usa una organización ficticia llamada **Complejo La Cancha** con:

- Tres canchas: Fútbol 5, Fútbol 7 y Fútbol 8.
- Horarios entre las 08:00 y las 23:00.
- Turnos de 1 y 2 horas.
- Precios en ARS.
- Reservas de ejemplo con nombres argentinos plausibles.
- Algunos turnos disponibles, confirmados, pendientes y bloqueados.

## Restricciones técnicas para el prototipo

- Crear un prototipo navegable con datos mock.
- No implementar backend, base de datos, pagos ni autenticación real dentro de Stitch.
- Mantener separadas las rutas y componentes de Sistema Canchas respecto de El Pizarrón del DT.
- Preparar la composición para conectarla después a estos contratos REST:
  - `/api/v1/auth/register`
  - `/api/v1/auth/login`
  - `/api/v1/auth/me`
  - `/api/v1/organizations/me`
  - `/api/v1/facilities`
  - `/api/v1/courts`
  - `/api/v1/courts/:courtId/shift-rules`
  - `/api/v1/courts/:courtId/shifts/generate`
  - `/api/v1/availability`
  - `/api/v1/bookings`
  - `/api/v1/bookings/:id/confirm`
  - `/api/v1/bookings/:id/cancel`
  - `/api/v1/bookings/:id/reschedule`
  - `/api/v1/bookings/:id/complete`

## Entregable esperado

Genera las pantallas desktop y mobile del flujo completo, conectadas entre sí mediante navegación visible y datos de demostración. Prioriza el dashboard, la disponibilidad y la bandeja de reservas como las vistas más importantes para validar el producto.