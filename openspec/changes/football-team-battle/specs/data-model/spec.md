## REQUISITOS AGREGADOS

### Requisito: Modelo de datos principales
El sistema DEBE definir las entidades principales para jugadores, equipos y partidos, de modo que tanto backend como frontend puedan reutilizarlas.

#### Entidad: Player
- `id`: Identificador único de tipo UUID
- `name`: Nombre completo del jugador
- `nationality`: Nacionalidad del jugador
- `position`: Posición en el campo, uno de GK, DEF, MID, FWD
- `stats`: Objeto con atributos estándar de jugador, cada uno numérico del 1 al 99

#### Entidad: Team
- `id`: Identificador único de tipo UUID
- `name`: Nombre del equipo
- `startingEleven`: Array de 11 referencias a la entidad `Player`

#### Entidad: Match
- `id`: Identificador único de tipo UUID
- `homeTeam`: Referencia a un `Team`
- `awayTeam`: Referencia a un `Team`
- `homeScore`: Número de goles anotados por el equipo local
- `awayScore`: Número de goles anotados por el equipo visitante
- `status`: Estado del partido, uno de PENDING, PLAYING, FINISHED
