## ADDED Requirements

### Requirement: Contexto de organización
El sistema SHALL asociar cada sesión B2B con una única organización activa y aplicar ese contexto a todas las operaciones administrativas. La identidad, sesión y credencial B2B SHALL ser independientes del juego.

#### Scenario: Sesión válida
- **WHEN** un usuario autenticado selecciona una organización a la que pertenece
- **THEN** el sistema establece esa organización como contexto activo

#### Scenario: Base independiente
- **WHEN** un usuario inicia sesión en Sistema Canchas
- **THEN** se autentica contra el servicio y la base B2B, sin consultar usuarios ni tablas de El Pizarrón del DT

### Requirement: Control de roles
El sistema SHALL restringir operaciones según los roles `OWNER`, `ADMIN`, `OPERATOR` y `CLIENT`, y no confiar únicamente en permisos enviados por el frontend.

#### Scenario: Operador administra reservas
- **WHEN** un operador solicita consultar o actualizar reservas de su organización
- **THEN** la API autoriza la operación dentro de su tenant

#### Scenario: Cliente modifica configuración
- **WHEN** un cliente intenta editar horarios o precios
- **THEN** la API rechaza la operación

#### Scenario: Cliente reserva autenticado
- **WHEN** un cliente con cuenta B2B autenticado solicita un turno libre
- **THEN** la API permite iniciar la reserva asociándola a su usuario

#### Scenario: Reserva anónima
- **WHEN** una solicitud sin JWT B2B intenta crear una reserva
- **THEN** la API rechaza la solicitud y no crea ningún registro