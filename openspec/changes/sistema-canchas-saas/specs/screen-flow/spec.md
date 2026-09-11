## MODIFIED Requirements

### Requirement: Navegación por barra de pestañas
El sistema MUST ofrecer una navegación principal que presente Sistema Canchas como entrada B2B y mantenga las pestañas del juego: **Inicio**, **Formación y Equipo**, **Historial y Cartas** y **Copa Élite**. El avance entre pantallas se realiza mediante estas pestañas, el selector de productos y botones de acción dentro de cada flujo.

#### Scenario: Entrada principal B2B
- **WHEN** un usuario abre la aplicación
- **THEN** se muestra Sistema Canchas como experiencia de entrada, con acceso a su dashboard o recorrido inicial

#### Scenario: Cambiar de producto
- **WHEN** el usuario activa El Pizarrón del DT desde Sistema Canchas
- **THEN** se muestra la Home del juego y su Navbar con las pestañas existentes

#### Scenario: Acceso directo dentro del juego
- **WHEN** el usuario está en una pantalla del juego
- **THEN** puede ir a cualquier otra pantalla principal desde la Navbar sin necesidad de volver paso a paso