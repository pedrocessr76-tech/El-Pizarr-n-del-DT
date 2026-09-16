## ADDED Requirements

### Requirement: Header mobile fijo por superficie
El sistema MUST mostrar en viewports `< md` (768px) un header superior fijo con `pt-safe` (safe-area-inset-top) y `backdrop-blur` en cada superficie: el juego con la marca "El Pizarrón del DT" y el título de la sección activa; Canchas con la marca "Sistema Canchas" y el complejo activo. En desktop (`≥ md`) el header mobile MUST NOT mostrarse.

#### Scenario: Header del juego en mobile
- **WHEN** el usuario abre el juego en un viewport menor a `md`
- **THEN** ve un header fijo con la marca del juego y el nombre de la sección actual, sin solaparse con el contenido.

#### Scenario: Header de Canchas en mobile
- **WHEN** el usuario autenticado abre Canchas en un viewport menor a `md`
- **THEN** ve un header fijo con la marca de Sistema Canchas y el nombre del complejo activo.

#### Scenario: Desktop sin header mobile
- **WHEN** el viewport es mayor o igual a `md`
- **THEN** el header mobile no se renderiza y se usa la barra superior de escritorio existente.

### Requirement: Bottom tab bar fijo
El sistema MUST mostrar en `< md` una barra de navegación inferior fija con `pb-safe` (safe-area-inset-bottom), `backdrop-blur` y un conjunto de pestañas con ícono y etiqueta. La pestaña activa MUST distinguirse visualmente y marcar `aria-current`. El juego MUST ofrecer las pestañas **Inicio**, **Formación y Equipo**, **Historial y Cartas** y **Copa Élite**; Canchas MUST ofrecer **Reservar**, **Mis Turnos**, **Operativa** y **Perfil**.

#### Scenario: Navegar entre secciones del juego
- **WHEN** el usuario presiona una pestaña del bottom nav del juego
- **THEN** se muestra la pantalla correspondiente y la pestaña queda marcada como activa.

#### Scenario: Navegar entre secciones de Canchas
- **WHEN** el usuario (staff o cliente) presiona una pestaña del bottom nav de Canchas
- **THEN** se muestra la vista correspondiente según su rol y la pestaña queda marcada como activa.

#### Scenario: Contenido no tapado por el nav
- **WHEN** una pantalla mobile se renderiza
- **THEN** el contenido reserva espacio inferior suficiente para no quedar oculto tras el bottom nav.

### Requirement: Alternancia mobile/desktop sin regresión
El sistema MUST mantener la navegación de escritorio (pestañas superiores del juego y layout con sidebar de Canchas) para `≥ md`, y MUST usar el shell mobile (`< md`) sin duplicar el contenido de las páginas.

#### Scenario: Desktop conserva la navegación actual
- **WHEN** el usuario abre la app en un viewport `≥ md`
- **THEN** la navegación de escritorio se muestra como antes y el shell mobile permanece oculto.

### Requirement: Áreas táctiles accesibles
Los controles interactivos del shell y de las pantallas mobile (pestañas, botones, inputs, chips) MUST tener un área táctil de al menos 44x44 px y feedback de presión (`active:scale`).

#### Scenario: Toque de un control
- **WHEN** el usuario toca una pestaña o botón en mobile
- **THEN** el objetivo táctil es de al menos 44x44 px y el control responde visualmente a la presión.
