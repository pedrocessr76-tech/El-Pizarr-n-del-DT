## ADDED Requirements

### Requirement: Entidad Player
El sistema DEBE almacenar jugadores con id (UUID), name, nationality, position (GK|DEF|MID|FWD), rating y stats (pace, shooting, passing, dribbling, defending, physical), todos 1-99.

#### Scenario: Crear jugador
- **WHEN** se persiste un nuevo jugador en la tabla `players`
- **THEN** todas las columnas se guardan correctamente con sus valores

### Requirement: Entidad Team
El sistema DEBE almacenar equipos con id (UUID), name y userId (nullable).

#### Scenario: Crear equipo
- **WHEN** se crea un equipo vía POST /draft/team
- **THEN** se persiste un registro en la tabla `teams` con UUID generado

### Requirement: Entidad TeamPlayer
El sistema DEBE almacenar la relación muchos-a-muchos entre equipos y jugadores, con isStarter (boolean) y slotIndex.

#### Scenario: Agregar jugador a equipo
- **WHEN** se asigna un jugador a un equipo vía POST /draft/team/player
- **THEN** se persiste un registro en `team_players`

### Requirement: Entidad Match
El sistema DEBE almacenar partidos con tournamentId, round (OCTAVOS|CUARTOS|SEMIS|FINAL), userId, homeTeamId, awayTeamId, homeScore, awayScore, status (PENDING|FINISHED), winnerId.

#### Scenario: Crear partido
- **WHEN** se genera un torneo
- **THEN** se crean 7 partidos (4 octavos + 2 cuartos + 1 final) en la tabla `matches`

### Requirement: Entidad User
El sistema DEBE almacenar usuarios con id (UUID auto-generado), username (único), password (bcrypt) y createdAt.

#### Scenario: Registrar usuario
- **WHEN** se registra un nuevo usuario
- **THEN** se persiste en la tabla `users` con contraseña hasheada
