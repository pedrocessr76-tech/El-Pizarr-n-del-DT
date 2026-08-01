## ADDED Requirements

### Requirement: Resumen de partido — PENDIENTE
El sistema DEBE mostrar un resumen del último partido jugado con resultado, calificaciones de ambos equipos y ganador.

#### Scenario: Mostrar resultado
- **WHEN** se completa un partido
- **THEN** el sistema muestra el resumen del resultado y el ganador

### Requirement: Retroalimentación de preparación — PENDIENTE
El sistema DEBE informar al usuario si el equipo está listo para un partido.

#### Scenario: Equipo listo
- **WHEN** la alineación tiene 11 titulares
- **THEN** el sistema muestra mensaje "Equipo listo para el partido"

#### Scenario: Equipo incompleto
- **WHEN** la alineación tiene menos de 11 titulares
- **THEN** el sistema muestra un mensaje indicando cuántos jugadores faltan

### Requirement: Historial de partidos — PENDIENTE
El sistema DEBE registrar y mostrar el historial de partidos del usuario (victorias, empates, derrotas).

#### Scenario: Ver historial
- **WHEN** el usuario consulta su perfil
- **THEN** el sistema muestra el historial de partidos jugados
