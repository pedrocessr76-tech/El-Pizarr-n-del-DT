## ADDED Requirements

### Requirement: Creación de torneo
El sistema DEBE crear un torneo con 7 partidos (4 octavos + 2 cuartos + 1 final) y 15 equipos IA + el equipo del usuario vía POST /match/tournament/create.

#### Scenario: Iniciar torneo
- **WHEN** el usuario inicia el modo torneo
- **THEN** el sistema genera un bracket con 16 equipos (usuario + 15 IA)

### Requirement: Simulación de partido
El sistema DEBE simular un partido y persistir el resultado vía POST /match/tournament/simulate-match.

#### Scenario: Simular encuentro
- **WHEN** se resuelve un partido del torneo
- **THEN** el sistema calcula el marcador y guarda homeScore, awayScore y status=FINISHED

### Requirement: Consulta de torneo
El sistema DEBE exponer GET /match/tournament/:id para obtener el estado actual del torneo.

#### Scenario: Ver bracket
- **WHEN** el usuario consulta el torneo
- **THEN** el sistema devuelve todos los partidos con sus resultados

### Requirement: Consulta de equipo
El sistema DEBE exponer GET /match/team/:id para obtener un equipo con sus jugadores.

#### Scenario: Ver plantilla
- **WHEN** el usuario consulta su equipo
- **THEN** el sistema devuelve el equipo con todos sus jugadores asignados

### Requirement: Progresión de bracket — PENDIENTE
El sistema DEBE avanzar al ganador de cada ronda a la siguiente (OCTAVOS → CUARTOS → SEMIS → FINAL).

#### Scenario: Avanzar ronda
- **WHEN** un partido finaliza
- **THEN** el ganador avanza a la siguiente ronda del bracket

### Requirement: Dificultad dinámica — PENDIENTE
El sistema DEBE escalar la dificultad según la media de rating del equipo oponente.

#### Scenario: Escalamiento de dificultad
- **WHEN** se simula un partido
- **THEN** la probabilidad de victoria se basa en la diferencia de medias

### Requirement: Desempate — PENDIENTE
El sistema DEBE resolver empates (ej. penales) para asegurar un ganador.

#### Scenario: Partido empatado
- **WHEN** el marcador termina empatado
- **THEN** el sistema declara un ganador por desempate
