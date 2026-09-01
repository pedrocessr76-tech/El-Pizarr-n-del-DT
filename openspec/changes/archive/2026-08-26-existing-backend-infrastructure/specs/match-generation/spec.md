## ADDED Requirements

### Requirement: Creación de torneo
El sistema MUST crear un torneo de eliminación directa con 16 equipos (el del usuario + 15 equipos reales/IA) vía `POST /match/tournament/create`, aceptando `userId` o `sessionId` como identidad.

#### Scenario: Iniciar la Copa Élite
- **WHEN** el usuario crea un torneo desde su equipo
- **THEN** el sistema genera los 8 partidos de OCTAVOS con sus rivales reales y lo deja en `IN_PROGRESS`.

### Requirement: Simulación del partido ponderada por rating
El sistema MUST simular un partido basándose en la media de rating de los 11 titulares, distribuyendo los goles con Poisson (`±12 puntos de rating ≈ ±1 gol esperado`) y persistiendo el resultado vía `POST /match/tournament/simulate-match`.

#### Scenario: Simular un encuentro
- **WHEN** se resuelve un partido del torneo
- **THEN** el sistema calcula y guarda `homeScore`, `awayScore`, `status=FINISHED` y `winnerId`.

### Requirement: Desempate por penales ponderado
El sistema MUST resolver los empates mediante una tanda de penales ponderada por el rating para declarar un ganador (probabilidad 0.5 ± diferencia/40, acotada entre 0.15 y 0.85).

#### Scenario: Partido que termina empatado
- **WHEN** el marcador queda igualado
- **THEN** el sistema determina un ganador por desempate ponderado para decidir quién avanza.

### Requirement: Progresión de llaves (OCTAVOS → FINAL)
El sistema MUST avanzar el bracket al simular las llaves IA pendientes y generar la siguiente ronda vía `POST /match/tournament/:id/advance`; el usuario debe haber jugado su llave; si la Gran Final termina, el torneo pasa a `COMPLETED`.

#### Scenario: Avanzar de ronda
- **WHEN** el usuario termina su partido y pide avanzar
- **THEN** se simulan/persisten las llaves IA de la ronda y se generan los cruces de la siguiente ronda.

### Requirement: Finalización del torneo por derrota/abandono
El sistema SHALL permitir marcar un torneo como `COMPLETED` vía `POST /match/tournament/:id/complete`.

#### Scenario: Terminar el torneo
- **WHEN** el usuario pierde o abandona
- **THEN** el sistema marca el torneo como COMPLETED para cerrar la partida.

### Requirement: Consulta de torneo y de equipo
El sistema MUST exponer `GET /match/tournament/:id` (bracket y rondas) y `GET /match/team/:id` (plantilla con titulares y suplentes).

#### Scenario: Recargar el bracket
- **WHEN** el frontend recarga el estado del torneo
- **THEN** el sistema devuelve las 4 rondas con su estado y marcadores.