## ADDED Requirements

### Requirement: Apertura de sobre (Pack Opening)
El sistema DEBE retornar 5 jugadores aleatorios del catálogo global vía GET /draft/pack.

#### Scenario: Obtener sobre de jugadores
- **WHEN** el usuario solicita abrir un sobre
- **THEN** el sistema retorna exactamente 5 jugadores aleatorios de la DB

### Requirement: Selección de jugador del sobre
El sistema DEBE verificar que un jugador existe en la DB vía POST /draft/select.

#### Scenario: Verificar jugador
- **WHEN** el usuario selecciona un jugador del sobre
- **THEN** el sistema verifica su existencia en la DB

### Requirement: Validación de equipo completo — PENDIENTE
El sistema DEBE impedir seleccionar jugadores si el equipo ya tiene 11 titulares.

#### Scenario: Evitar exceder tamaño de plantilla
- **WHEN** el equipo ya contiene 11 jugadores
- **THEN** el sistema bloquea la adición y muestra un mensaje
