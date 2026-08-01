## ADDED Requirements

### Requirement: Sin menú de navegación
El sistema NO DEBE tener menú lateral, barra de navegación, buscador de pantallas ni ningún elemento de navegación persistente. El avance entre pantallas se hace EXCLUSIVAMENTE mediante botones de acción dentro del flujo de ejecución. No hay forma de saltar entre pantallas arbitrariamente.

#### Scenario: Navegación solo por botones de acción
- **WHEN** el usuario completa una pantalla o presiona un botón de acción
- **THEN** la siguiente pantalla se muestra según el flujo definido, sin menú ni barra de navegación

#### Scenario: Sin acceso directo a otras pantallas
- **WHEN** el usuario está en una pantalla
- **THEN** no hay menú ni atajos para ir a otras pantallas que no sean la siguiente o anterior del flujo

### Requirement: Login opcional en esquina superior derecha
El sistema NO DEBE obligar al usuario a iniciar sesión. La pantalla principal (Home) se muestra al abrir la app. En la esquina superior derecha DEBE aparecer un icono/logo de login. Al presionarlo, se abre un contenedor overlay sobre la pantalla actual con el formulario de inicio de sesión y registro.

#### Scenario: Home es la pantalla inicial
- **WHEN** el usuario abre la app
- **THEN** se muestra la pantalla Home con los botones principales, sin pedir login

#### Scenario: Botón de login en top-right
- **WHEN** la pantalla Home se renderiza
- **THEN** en la esquina superior derecha hay un icono/logo para iniciar sesión

#### Scenario: Login en overlay
- **WHEN** el usuario presiona el icono de login
- **THEN** se abre un contenedor overlay sobre la Home con un cartel visible que dice "Iniciar Sesión", campos de usuario y contraseña bien armados y simples, y botón de envío

#### Scenario: Login exitoso
- **WHEN** el usuario ingresa credenciales válidas en el overlay
- **THEN** el overlay se cierra y el usuario queda autenticado en la Home

### Requirement: Flujo Home Principal
El sistema DEBE mostrar 3 botones grandes: "JUGAR", "VER HISTORIAL DE PARTIDAS", "VER TODAS LAS CARTAS". No hay navegación hacia atrás ni menú. Si el usuario no está autenticado, al presionar "Ver historial" puede redirigir al login o mostrar mensaje.

#### Scenario: Botón JUGAR
- **WHEN** el usuario presiona "JUGAR"
- **THEN** el sistema avanza a la pantalla de Elección de Alineación

#### Scenario: Botón VER HISTORIAL
- **WHEN** el usuario presiona "VER HISTORIAL DE PARTIDAS"
- **THEN** el sistema muestra el historial de partidas del usuario (si no está autenticado, pide login)

#### Scenario: Botón VER CARTAS
- **WHEN** el usuario presiona "VER TODAS LAS CARTAS"
- **THEN** el sistema muestra el catálogo completo de jugadores del juego

### Requirement: Flujo JUGAR completo
Al presionar "JUGAR" el flujo es secuencial y sin menú: Alineación → Armado de Equipo (con capitán) → Contenedor dificultad + stats → Partido en vivo → Torneo. No se puede retroceder a pantallas anteriores excepto con botón "Atrás".

#### Scenario: Paso 1 - Elección de Alineación
- **WHEN** el usuario presiona "JUGAR"
- **THEN** se muestran las formaciones disponibles para elegir una

#### Scenario: Paso 2 - Armado de Equipo (con capitán)
- **WHEN** el usuario confirma la formación
- **THEN** avanza a la pantalla de Armado de Equipo donde se colocan jugadores en posiciones y se elige capitán

#### Scenario: Paso 3 - Contenedor dificultad + stats (overlay)
- **WHEN** el usuario completa los 11 titulares + 7 suplentes
- **THEN** se abre un overlay sobre la pantalla de armado (como el login) con estadísticas del equipo arriba y abajo botón JUGAR + selector de dificultad (media por defecto)

#### Scenario: Paso 4 - Partido en vivo (overlay)
- **WHEN** el usuario presiona JUGAR con dificultad seleccionada
- **THEN** se abre un overlay sobre la pantalla actual simulando el partido en vivo a velocidad x30/x60/x90, siguiendo el mismo diseño de la página

#### Scenario: Paso 5 - Torneo Completo
- **WHEN** el partido en vivo finaliza
- **THEN** el sistema actualiza el bracket del torneo y muestra el resultado

### Requirement: Transiciones suaves y profesionales
Las transiciones entre pantallas DEBEN ser sutiles, no exageradas, con un flujo tranquilo y profesional. Sin animaciones bruscas ni efectos llamativos.

#### Scenario: Cambio de pantalla
- **WHEN** el usuario pasa de una pantalla a otra
- **THEN** la transición es suave (fade o slide sutil), dura menos de 300ms y se siente natural

### Requirement: Botón Atrás en flujo de juego
Cada pantalla dentro del flujo JUGAR DEBE tener un botón "Atrás" explícito para volver al paso anterior. Este es el ÚNICO modo de retroceder.

#### Scenario: Retroceder un paso
- **WHEN** el usuario presiona "Atrás" en cualquier pantalla del flujo
- **THEN** vuelve a la pantalla anterior del mismo flujo
