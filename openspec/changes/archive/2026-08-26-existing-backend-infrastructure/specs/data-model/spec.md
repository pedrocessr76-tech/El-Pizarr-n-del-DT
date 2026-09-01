## ADDED Requirements

### Requirement: Entidad Player
El sistema MUST almacenar jugadores con `id`, `name`, `nationality`, `position`, `rating` y `stats` (pace, shooting, passing, dribbling, defending, physical; 1-99) en la tabla `players`.

#### Scenario: Persistir un jugador del catálogo
- **WHEN** se guarda un jugador sincronizado desde el catálogo de datos
- **THEN** quedan persistidas sus 6 stats, su rating general y su posición.

### Requirement: Entidad Team
El sistema MUST almacenar equipos con `id`, `name`, `userId` (nullable), `sessionId` (nullable) y `isReal` en la tabla `teams`; `isReal` distingue los equipos IA (oponentes) de los equipos creados por usuarios.

#### Scenario: Crear equipo de usuario o de IA
- **WHEN** se crea un equipo de usuario o un equipo real del catálogo
- **THEN** se persiste el registro con el valor de `isReal` correspondiente.

### Requirement: Entidad TeamPlayer
El sistema MUST almacenar la relación muchos-a-muchos entre equipos y jugadores con `isStarter` (titular/suplente) y `slotIndex` en la tabla `team_players`.

#### Scenario: Asignar jugador a un slot
- **WHEN** se agrega un jugador a un equipo
- **THEN** se guarda si es titular o suplente y el índice del slot.

### Requirement: Entidad Match
El sistema MUST almacenar partidos con `tournamentId`, `round` (OCTAVOS|CUARTOS|SEMIS|FINAL), `userId`/`sessionId`, `homeTeamId`, `awayTeamId`, `homeScore`, `awayScore`, `status` (PENDING|FINISHED) y `winnerId` en la tabla `matches`.

#### Scenario: Crear cruces de una ronda
- **WHEN** se genera el torneo o una siguiente ronda
- **THEN** se crean los partidos de esa ronda en estado PENDING con sus locales/visitantes.

### Requirement: Entidad Tournament
El sistema MUST almacenar torneos con `userId`/`sessionId`, `userTeamId`, `status` (IN_PROGRESS|COMPLETED) y `currentRound` en la tabla `tournaments`.

#### Scenario: Iniciar un torneo
- **WHEN** se crea un torneo
- **THEN** se registra la ronda inicial OCTAVOS y el estado IN_PROGRESS.

### Requirement: Entidad User
El sistema MUST almacenar usuarios con `id` (UUID), `username` único (3-15 caracteres), `password` con hash bcrypt y `createdAt` en la tabla `users`.

#### Scenario: Registrar un usuario
- **WHEN** se registra un nuevo usuario
- **THEN** se persiste con la contraseña hasheada y la fecha de creación.