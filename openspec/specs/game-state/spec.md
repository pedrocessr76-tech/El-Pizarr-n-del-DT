## ADDED Requirements

### Requirement: Pantalla Home Principal con toggle oscuro/claro
El sistema DEBE mostrar el logo del juego en el centro o parte superior, y 3 botones debajo: "JUGAR" debe ser el más grande y llamativo, "VER HISTORIAL DE PARTIDAS" y "VER TODAS LAS CARTAS" se colocan uno a la izquierda y otro a la derecha con un diseño profesional y estético. Sin menú de navegación. DEBE incluir un botón toggle para cambiar entre modo oscuro y modo claro en la esquina superior derecha junto al icono de login.

#### Scenario: Home con logo y 3 botones
- **WHEN** el usuario abre la app o se autentica
- **THEN** el sistema muestra el logo del juego, un botón JUGAR grande y destacado en el centro, y a sus laterales izquierdo/derecho los botones VER HISTORIAL y VER CARTAS

#### Scenario: Toggle modo oscuro/claro
- **WHEN** el usuario presiona el toggle en la esquina superior derecha
- **THEN** el sistema cambia entre modo oscuro (fondo verde oscuro #1a3a2a, texto blanco) y modo claro (fondo blanco/verde claro, texto oscuro)

### Requirement: Catálogo de jugadores
El sistema DEBE mostrar todas las cartas de jugadores disponibles en el juego en formato grilla, con filtro por posición y búsqueda por nombre.

#### Scenario: Ver todas las cartas
- **WHEN** el usuario presiona "Ver todas las cartas de jugadores"
- **THEN** el sistema muestra todos los jugadores del catálogo en una grilla de cartas con foto, nombre, posición y rating

#### Scenario: Filtrar por posición
- **WHEN** el usuario selecciona un filtro de posición (GK, DEF, MID, FWD)
- **THEN** el sistema muestra solo los jugadores de esa posición

#### Scenario: Buscar por nombre
- **WHEN** el usuario escribe en el campo de búsqueda
- **THEN** el sistema filtra los jugadores cuyo nombre contenga el texto ingresado

### Requirement: Historial de equipos creados
El sistema DEBE mostrar el historial de equipos que el usuario ha armado en partidas anteriores. Cada equipo se muestra con un nombre autogenerado "Equipo 1", "Equipo 2", etc. (incrementando el número) y la alineación utilizada.

#### Scenario: Ver historial de equipos
- **WHEN** el usuario presiona "VER HISTORIAL DE PARTIDAS"
- **THEN** el sistema muestra una lista de los equipos creados anteriormente con su nombre (Equipo 1, Equipo 2...), formación elegida y rating medio

### Requirement: Pantalla de Torneo Completo con bracket moderno
El sistema DEBE mostrar el bracket completo del torneo con los 16 equipos visibles en su totalidad, sin scroll. Diseño profesional y moderno con 4 rondas (OCTAVOS, CUARTOS, SEMIS, FINAL), líneas conectoras entre rondas, nombres de equipos, escudos y marcadores. Los ganadores DEBEN resaltarse visualmente.

#### Scenario: Ver bracket completo sin scroll
- **WHEN** el usuario llega a la pantalla de torneo
- **THEN** el sistema muestra los 16 equipos en el bracket completo de eliminación directa, visible en su totalidad sin necesidad de hacer scroll

#### Scenario: Ver rondas y conexiones
- **WHEN** el bracket se renderiza
- **THEN** se ven las 4 rondas (OCTAVOS → CUARTOS → SEMIS → FINAL) con líneas conectoras desde los ganadores hacia la siguiente ronda

#### Scenario: Partido jugado en bracket
- **WHEN** un partido del bracket se ha completado
- **THEN** el sistema muestra el marcador (homeScore - awayScore) y resalta al ganador con un estilo visual distintivo (color, borde o badge)

### Requirement: Resumen de partido
El sistema DEBE mostrar un resumen al completarse un partido con el resultado, las calificaciones de ambos equipos y el ganador.

#### Scenario: Mostrar resultado
- **WHEN** se completa un partido
- **THEN** el sistema muestra el resumen del resultado y el ganador

### Requirement: Contenedor de dificultad con stats del equipo
La dificultad NO DEBE ser una pantalla separada. Al completar el armado del equipo, se DEBE abrir un contenedor vertical sobre la pantalla actual. En la parte superior muestra las estadísticas del equipo (rating medio, química, etc.). En la parte inferior muestra el botón "JUGAR" y un selector de dificultad (Fácil, Normal, Difícil). La dificultad "Normal" DEBE estar seleccionada por defecto.

#### Scenario: Contenedor post-armado
- **WHEN** el usuario completa los 11 titulares + 7 suplentes
- **THEN** se abre un contenedor vertical con stats del equipo arriba y botón JUGAR + selector dificultad abajo, con Normal preseleccionado

#### Scenario: Cambiar dificultad
- **WHEN** el usuario selecciona Fácil o Difícil
- **THEN** el sistema ajusta los ratings de los equipos IA según la dificultad elegida

#### Scenario: Iniciar torneo
- **WHEN** el usuario presiona JUGAR en el contenedor
- **THEN** el contenedor se cierra y comienza la simulación del partido en vivo

### Requirement: Partido en vivo con velocidad acelerada
Al iniciar un partido, el sistema DEBE abrir un contenedor que simule el desarrollo del partido minuto a minuto a velocidad acelerada (x30, x60 o x90). El contenedor DEBE mostrar el tiempo transcurrido, el marcador actualizado dinámicamente y los goles a medida que ocurren.

#### Scenario: Iniciar partido en vivo
- **WHEN** el usuario presiona JUGAR en el contenedor de dificultad
- **THEN** se abre un contenedor de partido en vivo que avanza a velocidad acelerada mostrando el marcador en tiempo real

#### Scenario: Gol durante el partido
- **WHEN** ocurre un gol en la simulación
- **THEN** el marcador se actualiza y se muestra una notificación visual del gol (equipo, minuto)

#### Scenario: Fin del partido
- **WHEN** la simulación llega al minuto 90
- **THEN** el contenedor muestra el resultado final y un botón para continuar al bracket del torneo

### Requirement: Retroalimentación de preparación
El sistema DEBE informar al usuario si el equipo está listo para el torneo (11 titulares + 7 suplentes asignados).

#### Scenario: Equipo completo
- **WHEN** el equipo tiene 18 jugadores
- **THEN** el sistema muestra "Equipo listo para el torneo"

#### Scenario: Equipo incompleto
- **WHEN** faltan jugadores
- **THEN** el sistema indica cuántos jugadores faltan por posición
