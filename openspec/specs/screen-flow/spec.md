# screen-flow

## Purpose

Define la navegación y el flujo de pantallas del juego: barra de navegación por pestañas, acceso al login en overlay, y el flujo principal desde el Home hasta el torneo completo.

## Requirements

### Requirement: Navegación por barra de pestañas
El sistema MUST ofrecer una barra de navegación superior (Navbar) fija con pestañas: **Inicio**, **Formación y Equipo**, **Historial y Cartas** y **Copa Élite**. El avance entre pantallas se realiza mediante estas pestañas y botones de acción dentro del flujo.

#### Scenario: Cambiar de pestaña
- **WHEN** el usuario presiona una pestaña de la Navbar
- **THEN** se muestra la pantalla correspondiente.
#### Scenario: Acceso directo
- **WHEN** el usuario está en una pantalla
- **THEN** puede ir a cualquier otra pantalla principal desde la Navbar (sin necesidad de volver paso a paso).

### Requirement: Login opcional en overlay
El sistema MUST mostrar la Home al abrir la app sin exigir login. Un botón "Iniciar Sesión" en la esquina superior (Home) y en la Navbar abre el overlay modal de login/registro.

#### Scenario: Home inicial sin login
- **WHEN** el usuario abre la app
- **THEN** se muestra la Home con los botones principales, sin pedir login.
#### Scenario: Abrir el login en overlay
- **WHEN** el usuario presiona "Iniciar Sesión"
- **THEN** se abre un overlay modal con los formularios de acceso y registro.
#### Scenario: Login exitoso
- **WHEN** el usuario ingresa credenciales válidas
- **THEN** el overlay se cierra y el usuario queda autenticado.

### Requirement: Flujo principal desde Home
La Home MUST mostrar el logo del juego y 3 botones de acción: **JUGAR** (va a Formación y Equipo), **VER HISTORIAL DE PARTIDAS** y **VER TODAS LAS CARTAS**.

#### Scenario: Botón JUGAR
- **WHEN** el usuario presiona "JUGAR"
- **THEN** se avanza a "Formación y Equipo" para armar el equipo.
#### Scenario: Botón HISTORIAL
- **WHEN** el usuario presiona "VER HISTORIAL DE PARTIDAS"
- **THEN** se muestra la vista de historial (requiere sesión; si no, lista vacía).
#### Scenario: Botón CARTAS
- **WHEN** el usuario presiona "VER TODAS LAS CARTAS"
- **THEN** se muestra el catálogo completo de jugadores.

### Requirement: Flujo de juego (formación → torneo)
El sistema MUST seguir el flujo: **Formación y Equipo** (armado de equipo) → **Copa Élite** (bracket/torneo), con el partido en vivo y el fin de torneo como overlays dentro del flujo.

#### Scenario: Completar el armado
- **WHEN** el usuario completa 11 titulares + 7 suplentes
- **THEN** puede avanzar a la Copa Élite.
#### Scenario: Navegar al torneo
- **WHEN** el usuario entra a "Copa Élite"
- **THEN** se crea/reanuda el torneo y se muestra el bracket.

### Requirement: Transiciones suaves
El sistema MUST aplicar transiciones sutiles entre pantallas (fade/slide cortos, < 300ms) y sin animaciones bruscas.

#### Scenario: Cambiar de pantalla
- **WHEN** el usuario navega entre pantallas
- **THEN** la transición es suave y breve.