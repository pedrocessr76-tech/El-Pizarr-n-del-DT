## ADDED Requirements

### Requirement: Inicio mobile
En `< md`, la Home MUST presentar el branding y las acciones reales priorizando el pulgar: una acción primaria **JUGAR** de ancho completo, acciones secundarias de **Historial** y **Cartas**, y, cuando exista equipo en `useDraftStore`, una tarjeta resumen de plantilla con datos reales (nombre/OVR/química). MUST NOT usar valores hardcodeados de los mockups. Las tarjetas MUST dejar de tener altura fija para adaptarse al contenido.

#### Scenario: Home con equipo existente
- **WHEN** el usuario abre la Home en mobile y tiene un equipo en el store
- **THEN** ve el CTA JUGAR y una tarjeta de resumen con los datos reales de su plantilla.

#### Scenario: Home sin equipo
- **WHEN** el usuario abre la Home en mobile sin equipo
- **THEN** ve el CTA JUGAR y las acciones secundarias, sin una tarjeta de resumen vacía con datos inventados.

#### Scenario: Acción JUGAR
- **WHEN** el usuario presiona JUGAR en mobile
- **THEN** avanza a "Formación y Equipo".

### Requirement: Formación y Equipo mobile
En `< md`, el armado MUST mostrar la cancha en orientación vertical escalada al ancho del teléfono, un HUD con la formación y stats reales, la banca de 7 suplentes como una franja horizontal deslizable, la selección de dificultad como control segmentado y una barra **Continuar** fija sobre el bottom nav. El modal de preparación de partido MUST presentarse como bottom sheet. La validación de plantilla (11 titulares + 7 suplentes) y el capitán MUST conservarse.

#### Scenario: Ver el armado en mobile
- **WHEN** el usuario entra a "Formación y Equipo" en mobile
- **THEN** ve la cancha vertical, el HUD de formación, la banca horizontal y la barra Continuar fija.

#### Scenario: Abrir el modal de preparación
- **WHEN** el usuario intenta continuar sin completar la plantilla
- **THEN** se abre un bottom sheet con cuántos titulares faltan y las acciones de auto-completar/editar táctica.

#### Scenario: Plantilla completa
- **WHEN** hay 11 titulares + 7 suplentes
- **THEN** la barra Continuar habilita el avance al torneo.

### Requirement: Torneo y partido en vivo mobile
En `< md`, la pantalla de torneo MUST mostrar un banner de "En Vivo", un selector de ronda segmentado, la tarjeta del partido activo con marcador/tiempo reales y los controles de órdenes tácticas, adaptados al ancho del teléfono. Los avisos de fin de partido MUST usar feedback en la interfaz (estado inline o toast existente) y MUST NOT usar `alert()`.

#### Scenario: Ver el partido en vivo
- **WHEN** el usuario está en un partido en vivo en mobile
- **THEN** ve el marcador, el tiempo y los botones de órdenes tácticas sin desbordes horizontales.

#### Scenario: Finalizar partido
- **WHEN** el partido termina en mobile
- **THEN** el resultado se comunica mediante un estado en la interfaz o toast, sin `alert()`.

### Requirement: Catálogo e Historial mobile
En `< md`, el catálogo MUST mostrar una grilla de 2 columnas con filtros accesibles (búsqueda y filtros como controles táctiles o panel desplegable) y el historial MUST adaptar su tabla a un formato legible en el ancho del teléfono (tarjetas o scroll interno), sin desbordar la pantalla.

#### Scenario: Explorar el catálogo en mobile
- **WHEN** el usuario abre el catálogo en mobile
- **THEN** ve una grilla de 2 columnas y puede aplicar filtros sin desbordes.

#### Scenario: Ver historial en mobile
- **WHEN** el usuario autenticado abre el historial en mobile
- **THEN** los torneos se muestran legibles sin generar scroll horizontal de página.
