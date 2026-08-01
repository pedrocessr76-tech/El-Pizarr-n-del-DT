## ADDED Requirements

### Requirement: Crear equipo
El sistema DEBE permitir crear un equipo vacío vía POST /draft/team.

#### Scenario: Crear nuevo equipo
- **WHEN** el usuario inicia un draft
- **THEN** el sistema crea un equipo vacío y devuelve su ID

### Requirement: Agregar jugador al equipo
El sistema DEBE permitir agregar un jugador al equipo vía POST /draft/team/player.

#### Scenario: Agregar jugador titular
- **WHEN** el usuario selecciona un jugador
- **THEN** el sistema lo agrega al equipo con isStarter=true (máximo 11)

### Requirement: Eliminar jugador del equipo
El sistema DEBE permitir eliminar un jugador del equipo vía DELETE /draft/team/:teamId/player/:playerId.

#### Scenario: Eliminar jugador
- **WHEN** el usuario elimina un jugador
- **THEN** el sistema lo remueve de la tabla team_players

### Requirement: Validación de 18 jugadores — PENDIENTE
El sistema DEBE limitar la plantilla a 18 jugadores (11 titulares + 7 suplentes).

#### Scenario: Limitar plantilla
- **WHEN** el usuario intenta agregar más de 18 jugadores
- **THEN** el sistema lo impide y muestra un aviso

### Requirement: Gestión de suplentes — PENDIENTE
El sistema DEBE permitir marcar jugadores como suplentes (isStarter=false).

#### Scenario: Agregar suplente
- **WHEN** el usuario agrega un jugador a la banca
- **THEN** el sistema lo registra con isStarter=false
