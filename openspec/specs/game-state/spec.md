# game-state

## Purpose

Define la visualización del estado del juego: la pantalla principal, el catálogo de cartas, el historial de torneos, el torneo completo con bracket y el partido en vivo, junto con la retroalimentación de preparación del equipo.

## Requirements

### Requirement: Home principal
El sistema MUST mostrar una pantalla principal con el logo del juego (FOOTBALL ELITE / El Pizarrón del DT), fondo de cancha con patrón, un botón "Iniciar Sesión" en la esquina superior y los 3 botones de acción (JUGAR, HISTORIAL, CARTAS).

#### Scenario: Ver la Home
- **WHEN** el usuario abre la app
- **THEN** se muestra el logo, el botón de login y los botones de acción principales.

### Requirement: Catálogo de jugadores
El sistema MUST mostrar todas las cartas de jugadores del catálogo (obtenidas de `GET /players`) en una grilla, con búsqueda por nombre, filtro por posición, por rareza (Oro/Plata/Bronce) y por rating mínimo.

#### Scenario: Ver y filtrar el catálogo
- **WHEN** el usuario abre el catálogo y aplica búsqueda/filtros
- **THEN** la grilla muestra solo los jugadores que cumplen los criterios.

### Requirement: Historial de torneos
El sistema MUST mostrar el historial de torneos del usuario (obtenido de `GET /match/history`), con nombre del equipo, rondas, marcadores y estado; los usuarios sin sesión ven una lista vacía.

#### Scenario: Ver historial
- **WHEN** el usuario consulta su historial
- **THEN** se muestran sus torneos anteriores con su detalle de rondas.

### Requirement: Torneo completo con bracket
El sistema MUST mostrar el bracket del torneo con las 4 rondas (Octavos → Cuartos → Semis → Final), conectores entre rondas y el ganador de cada partido resaltado; los partidos del usuario se juegan en vivo.

#### Scenario: Ver el bracket
- **WHEN** el usuario entra a "Copa Élite" con un torneo activo
- **THEN** se muestran las 4 rondas con sus cruces, marcadores y ganadores resaltados.

### Requirement: Partido en vivo
Al jugar su llave, el sistema MUST abrir un overlay que simule el partido minuto a minuto con velocidad x30/x60/x90, mostrando el tiempo, el marcador dinámico, los goles y comentarios en vivo.

#### Scenario: Iniciar el partido en vivo
- **WHEN** el usuario inicia su partido
- **THEN** se abre el overlay del partido en vivo con el reloj, el marcador y el feed de eventos.
#### Scenario: Gol durante el partido
- **WHEN** ocurre un gol
- **THEN** el marcador se actualiza y se muestra la notificación del gol.
#### Scenario: Fin del partido
- **WHEN** se llega al tiempo final
- **THEN** se muestra el resultado y las opciones para continuar o ver el resultado.

### Requirement: Retroalimentación de preparación
El sistema MUST informar si el equipo está listo para el torneo (11 titulares + 7 suplentes) y, si no, cuántos jugadores faltan.

#### Scenario: Equipo listo
- **WHEN** el equipo tiene 18 jugadores
- **THEN** el sistema indica que está listo para el torneo.
#### Scenario: Equipo incompleto
- **WHEN** faltan jugadores
- **THEN** el sistema indica cuántos jugadores faltan por asignar.