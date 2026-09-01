## ADDED Requirements

### Requirement: Crear (o reutilizar) un equipo
El sistema MUST permitir crear un equipo vacío vía `POST /draft/team`, aceptando `userId` o `sessionId` y devolviendo el `teamId`.

#### Scenario: Iniciar el armado del equipo
- **WHEN** el usuario inicia el armado
- **THEN** el sistema crea (o reutiliza) el equipo vacío y devuelve su ID.

### Requirement: Agregar jugador al equipo
El sistema MUST persistir cada jugador asignado vía `POST /draft/team/player` con `isStarter=true` para titulares y `isStarter=false` para suplentes, evitando duplicados.

#### Scenario: Guardar un titular
- **WHEN** el usuario asigna un jugador a la cancha
- **THEN** el sistema lo agrega con `isStarter=true`.
#### Scenario: Guardar un suplente
- **WHEN** el usuario asigna un jugador a la banca
- **THEN** el sistema lo agrega con `isStarter=false`.

### Requirement: Validación de plantilla (11 titulares + 7 suplentes)
El sistema MUST impedir que el equipo exceda 18 jugadores: un máximo de 11 titulares y un máximo de 7 suplentes.

#### Scenario: Evitar un duodécimo titular
- **WHEN** ya hay 11 titulares y el usuario intenta agregar otro titular
- **THEN** el sistema rechaza la operación y muestra un mensaje.
#### Scenario: Evitar un octavo suplente
- **WHEN** ya hay 7 suplentes y el usuario intenta agregar otro suplente
- **THEN** el sistema rechaza la operación y muestra un mensaje.

### Requirement: Quitar y restablecer jugadores
El sistema MUST permitir quitar un jugador del equipo vía `DELETE /draft/team/:teamId/player/:playerId` y vaciar el equipo vía `POST /draft/team/:teamId/reset`.

#### Scenario: Eliminar un jugador del equipo
- **WHEN** el usuario elimina un jugador
- **THEN** el sistema lo remueve de `team_players` y el equipo se actualiza.
#### Scenario: Reiniciar el equipo
- **WHEN** el usuario presiona reiniciar el equipo
- **THEN** el sistema elimina todos sus titulares y suplentes.