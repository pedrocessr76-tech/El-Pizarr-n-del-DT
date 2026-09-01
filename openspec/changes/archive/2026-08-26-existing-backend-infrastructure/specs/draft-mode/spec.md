## ADDED Requirements

### Requirement: Apertura de sobre (Pack Opening)
El sistema MUST retornar 5 jugadores aleatorios del catálogo global vía `GET /draft/pack`, y opcionalmente filtrarlos por una posición FIFA compatible (POR, LD, LI, DFC, MCD, MC, MCO, MD, MI, ED, EI, SD, DC, ST), usando un mapa de posiciones compatibles.

#### Scenario: Obtener sobre sin filtro
- **WHEN** el usuario solicita `GET /draft/pack`
- **THEN** el sistema devuelve exactamente 5 jugadores aleatorios.
#### Scenario: Obtener sobre filtrado por posición
- **WHEN** el usuario solicita `GET /draft/pack?position=DC`
- **THEN** el sistema devuelve 5 jugadores que pueden jugar en esa posición o en posiciones compatibles.

### Requirement: Selección de jugador del sobre
El sistema MUST verificar que el jugador exista en la DB vía `POST /draft/select`, devolviendo el jugador seleccionado.

#### Scenario: Verificar la selección
- **WHEN** el usuario elige un jugador del sobre
- **THEN** el sistema valida su existencia en la DB y devuelve su detalle.

### Requirement: Sesión de invitado (guest)
El sistema MUST permitir jugar sin iniciar sesión mediante un `sessionId` efímero (guardado en `sessionStorage`); todos los datos de la sesión (equipo, torneos, partidos) se persisten con ese `sessionId` y se limpian al cerrar la pestaña o al salir de la sesión (beacon + `POST /draft/session/cleanup`).

#### Scenario: Jugar como invitado
- **WHEN** un usuario sin sesión arma y juega
- **THEN** sus datos quedan asociados a un `sessionId` efímero que se borra al cerrar la pestaña.
#### Scenario: Adoptar el equipo como logueado
- **WHEN** el usuario inicia sesión/registro tras haber jugado como invitado
- **THEN** el sistema adopta el equipo de la sesión de invitado y limpia el `sessionId`.