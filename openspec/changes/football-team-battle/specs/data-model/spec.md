## REQUISITOS AGREGADOS

### Requisito: Modelo de datos principales
El sistema DEBE definir las entidades principales para jugadores, equipos y partidos, de modo que tanto backend como frontend puedan reutilizarlas.

#### Entidad: Player (tabla `players`)
- `id`: UUID (clave primaria)
- `name`: Nombre completo del jugador
- `nationality`: Nacionalidad del jugador
- `position`: Posición en el campo, uno de GK, DEF, MID, FWD
- `pace`: Velocidad (1-99)
- `shooting`: Tiro (1-99)
- `passing`: Pase (1-99)
- `dribbling`: Regate (1-99)
- `defending`: Defensa (1-99)
- `physical`: Físico (1-99)
- *Nota: Los stats se almacenan como columnas planas, no como objeto embebido.*

#### Entidad: Team (tabla `teams`)
- `id`: UUID (clave primaria)
- `name`: Nombre del equipo
- `userId`: UUID del usuario propietario (nullable)

#### Entidad: TeamPlayer (tabla `team_players`)
- `id`: UUID (clave primaria)
- `teamId`: UUID del equipo (foreign key a `teams`)
- `playerId`: UUID del jugador (foreign key a `players`)
- `isStarter`: Booleano (true = titular, false = suplente)
- `slotIndex`: Índice de posición en la alineación
- *Nota: Tabla intermedia muchos-a-muchos entre Team y Player.*

#### Entidad: Match (tabla `matches`)
- `id`: UUID (clave primaria)
- `tournamentId`: UUID del torneo al que pertenece
- `round`: Ronda del torneo (OCTAVOS, CUARTOS, SEMIS, FINAL)
- `userId`: UUID del usuario (nullable)
- `homeTeamId`: UUID del equipo local
- `awayTeamId`: UUID del equipo visitante
- `homeScore`: Goles del equipo local
- `awayScore`: Goles del equipo visitante
- `status`: Estado del partido, uno de PENDING, PLAYING, FINISHED
- `winnerId`: UUID del equipo ganador (nullable, usado para desempates)

#### Entidad: User (tabla `users`)
- `id`: UUID (clave primaria auto-generada)
- `username`: Nombre de usuario (único, 3-15 caracteres)
- `password`: Contraseña hasheada con bcrypt
- `createdAt`: Fecha de creación automática
