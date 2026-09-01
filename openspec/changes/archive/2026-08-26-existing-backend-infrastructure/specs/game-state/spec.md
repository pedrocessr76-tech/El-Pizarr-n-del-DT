## ADDED Requirements

### Requirement: Historial de torneos del usuario
El sistema MUST devolver el historial de torneos de un usuario vía `GET /match/history?userId=...`, incluyendo ronda alcanzada, estado, marcadores y el equipo del usuario; los invitados sin cuenta obtienen una lista vacía.

#### Scenario: Ver el historial
- **WHEN** el usuario consulta su historial
- **THEN** el sistema muestra sus torneos previos con los resultados de cada ronda.

### Requirement: Resumen de partido en vivo
El sistema SHALL mostrar al finalizar un partido el resultado final, el ganador y el avance (o la derrota) mediante el overlay de partido en vivo y el overlay de fin de torneo con estadísticas (partidos, victorias, empates, goles a favor/en contra, ronda alcanzada).

#### Scenario: Terminar un partido en vivo
- **WHEN** la simulación llega al minuto final
- **THEN** el overlay muestra el resultado y permite continuar o ver el resultado.

### Requirement: Retroalimentación de preparación del equipo
El sistema MUST informar cuántos jugadores faltan por asignar (11 titulares + 7 suplentes) antes de permitir avanzar.

#### Scenario: Equipo incompleto
- **WHEN** faltan jugadores por asignar
- **THEN** el sistema indica cuántos jugadores faltan y bloquea continuar.
#### Scenario: Equipo listo para el torneo
- **WHEN** los 18 jugadores están asignados
- **THEN** el sistema habilita avanzar al torneo.