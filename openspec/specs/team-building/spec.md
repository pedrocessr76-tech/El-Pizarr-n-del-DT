## ADDED Requirements

### Requirement: Pantalla de Elección de Alineación con 5 formaciones
El sistema DEBE mostrar EXACTAMENTE 5 formaciones disponibles para elegir. Cada formación se muestra como una opción visual con el nombre (ej. "4-3-3") y el diagrama de posiciones en la mini cancha.

#### Scenario: Ver 5 formaciones
- **WHEN** el usuario llega a la pantalla de Elección de Alineación
- **THEN** el sistema muestra 5 formaciones disponibles con su diagrama de posiciones (ej. 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2)

#### Scenario: Confirmar formación
- **WHEN** el usuario presiona una formación
- **THEN** el sistema guarda la formación seleccionada y avanza a la pantalla de Armado de Equipo

### Requirement: Capitán seleccionable desde la cancha
La elección de capitán DEBE funcionar igual que la selección de cualquier jugador. El usuario presiona el slot de capitán (o un botón/badge en la cancha), se abre un overlay con cartas de los jugadores del equipo, selecciona uno, el overlay se cierra y el jugador aparece en su posición con el bono de capitán.

#### Scenario: Abrir overlay de capitán
- **WHEN** el usuario presiona el slot de capitán en la cancha
- **THEN** se abre un overlay con cartas de todos los jugadores del equipo

#### Scenario: Elegir capitán
- **WHEN** el usuario toca una carta en el overlay
- **THEN** el overlay se cierra, el jugador se coloca en su posición y recibe +5 bonus en todas sus stats

#### Scenario: Cambiar capitán
- **WHEN** el usuario presiona el slot de capitán nuevamente
- **THEN** se abre el overlay y puede seleccionar otro jugador, reasignando el bono

### Requirement: Pantalla de Armado de Equipo
El sistema DEBE mostrar un layout con dos columnas: izquierda la cancha vertical, derecha las estadísticas del equipo y abajo la banca de suplentes. No DEBE requerir scroll para ver la cancha completa. La cancha DEBE mostrarse en orientación vertical (de arriba hacia abajo) con las posiciones según la formación elegida.

#### Scenario: Ver layout completo
- **WHEN** el usuario llega a Armado de Equipo
- **THEN** el sistema muestra:
  - Columna izquierda: cancha vertical con slots titulares (ej. 4-3-3: 1 GK + 4 DEF + 3 MID + 3 FWD)
  - Columna derecha (arriba): panel con estadísticas del equipo (rating medio, química, etc.)
  - Columna derecha (abajo): 7 slots de banca para suplentes

#### Scenario: Ver cancha vertical sin scroll
- **WHEN** la cancha se renderiza
- **THEN** la cancha completa es visible sin necesidad de hacer scroll, con todos los slots de posición distribuidos verticalmente

### Requirement: Selección de jugador mediante overlay de cartas
Cuando el usuario presiona un slot de posición vacío (titular o suplente), el sistema DEBE abrir un contenedor en modo overlay por encima de la pantalla actual, mostrando 5 cartas de jugador que pueden jugar en esa posición. Las cartas DEBEN mostrarse una al lado de la otra, sin superponerse, con un tamaño correcto para visualizar todos los datos.

#### Scenario: Presionar slot titular vacío
- **WHEN** el usuario presiona un slot de posición de titular vacío
- **THEN** el sistema abre un overlay con 5 cartas de jugadores que pueden jugar en esa posición, mostradas horizontalmente sin superposición

#### Scenario: Presionar slot de banca vacío
- **WHEN** el usuario presiona un slot de banca vacío
- **THEN** el sistema abre un overlay con 5 cartas de cualquier jugador disponible (sin filtro de posición), mostradas horizontalmente sin superposición

#### Scenario: Overlay con tamaño correcto
- **WHEN** el overlay de selección se abre
- **THEN** las 5 cartas se muestran una al lado de la otra con tamaño suficiente para ver silueta, bandera, nombre, posición, rating y barras de stats. Las cartas son EXACTAMENTE IGUALES a las del catálogo (estilo FIFA Ultimate Team), cada una diferente según el jugador que representan

#### Scenario: Seleccionar jugador del overlay
- **WHEN** el usuario presiona una carta en el overlay
- **THEN** el overlay se cierra, el jugador se asigna al slot y su carta aparece en la cancha

#### Scenario: Cerrar overlay sin seleccionar
- **WHEN** el usuario presiona fuera del overlay
- **THEN** el overlay se cierra sin asignar ningún jugador

### Requirement: Visualización de carta en la cancha
Cada jugador colocado en la cancha DEBE mostrarse como una carta compacta con: número de camiseta, nombre, posición, y rating general. Al tocar la carta se abre un detalle con stats completas.

#### Scenario: Tocar carta en cancha
- **WHEN** el usuario toca un jugador ya colocado en la cancha
- **THEN** se expande una vista detallada con foto, nacionalidad, y las 6 stats con barras

### Requirement: Validación de equipo completo
El sistema DEBE impedir avanzar hasta que los 11 titulares y 7 suplentes estén asignados.

#### Scenario: Intentar continuar incompleto
- **WHEN** faltan jugadores por asignar y el usuario presiona "Continuar"
- **THEN** el sistema muestra un mensaje indicando cuántos jugadores faltan

#### Scenario: Equipo listo
- **WHEN** los 11 titulares y 7 suplentes están asignados
- **THEN** el sistema habilita el botón "Continuar" y avanza a Elección de Dificultad

### Requirement: Crear equipo
El sistema DEBE permitir crear un equipo vacío vía POST /draft/team al iniciar un draft.

#### Scenario: Iniciar draft
- **WHEN** el usuario presiona "Jugar" en el Hub
- **THEN** el sistema crea un equipo vacío en la DB y devuelve su ID

### Requirement: Agregar jugador al equipo
El sistema DEBE persistir cada jugador seleccionado vía POST /draft/team/player con isStarter=true para titulares y isStarter=false para suplentes.

#### Scenario: Guardar titular
- **WHEN** el usuario asigna un titular en la cancha
- **THEN** el sistema lo agrega con isStarter=true

#### Scenario: Guardar suplente
- **WHEN** el usuario asigna un suplente en la banca
- **THEN** el sistema lo agrega con isStarter=false
