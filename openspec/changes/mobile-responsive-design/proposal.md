## Why

Hoy ambos productos (el juego **El Pizarrón del DT** y el SaaS **Sistema Canchas**) fueron diseñados *desktop-first*: el juego oculta su barra de pestañas por debajo de `md` (quedando sin navegación en mobile) y Canchas cae a un sidebar deslizable con tablas anchas. Stitch ya produjo 8 mockups mobile (en `stitch_elite_football_squad_builder/diseño_mobile`) con el lenguaje correcto (header fijo, bottom tab bar, bottom sheets, barras de acción flotantes), pero esos diseños quedaron desactualizados respecto de la app actual. Necesitamos **adaptar** ese lenguaje mobile a las pantallas y datos reales de hoy para que la app se vea y se sienta correcta en el teléfono.

## What Changes

- **Mobile shell compartido**: header superior fijo + **bottom tab bar** fijo (con `safe-area` insets y `backdrop-blur`) para el juego y para Canchas, visibles solo en mobile (`< md`). En desktop se conserva la `Navbar` superior actual.
- **Juego — pantallas mobile**: Inicio, Formación y Equipo (cancha vertical + armado + elección de formación + banca), Torneo / Partido en vivo y Catálogo / Historial, reinterpretando los mockups de Stitch con los datos reales (equipo, OVR, química, torneo) y el tema oscuro actual.
- **Canchas — pantallas mobile**: Login/Perfil dual (Jugador vs Dueño/Admin), Portal de reservas del cliente (selector de fecha, filtros, tarjetas de cancha con franjas horarias, hoja resumen flotante), Pago y Seña (progreso, resumen, modalidades y medios de pago, barra de checkout fija) y Dashboard Operativo (KPIs, acciones, próximos turnos, solicitudes online, cierre de caja).
- **Patrones táctiles**: barras flotantes por encima del bottom nav, bottom sheets para modales/flujo, feedback `active:scale`, formularios con inputs correctos (44px+), sin `alert()` (se reemplazan por estados inline/toasts existentes).
- **BREAKING**: ninguno a nivel de API/datos. Cambia la presentación y la navegación **en viewports mobile**; desktop queda igual.

## Capabilities

### New Capabilities
- `mobile-app-shell`: shell responsive compartido (breakpoint, header fijo, bottom tab bar con safe-area, mapeo pestaña↔pantalla del juego y de Canchas, y alternancia mobile/desktop).
- `game-mobile-screens`: layouts mobile de las pantallas del juego (Inicio, armado/formación, torneo/partido en vivo, catálogo/historial) adaptados de Stitch con datos reales.
- `canchas-mobile-screens`: layouts mobile de las pantallas de Sistema Canchas (login/perfil, portal reservas, pago/seña, dashboard operativo) adaptados de Stitch.

### Modified Capabilities
- `visual-identity`: se agregan reglas de composición responsive/mobile (barras fijas, insets de safe-area, zonas de alcance del pulgar, taps 44px) manteniendo el tema sobrio.
- `team-building`: el armado en mobile cambia de interacción (cancha vertical escalada, banca de suplentes como strip horizontal, barra "Continuar" fija y modal de preparación de partido como bottom sheet).

## Impact

- **Frontend (juego)**: `App.tsx`, `components/Navbar.tsx`, nuevas piezas de shell mobile, `pages/HomePage.tsx`, `pages/TeamBuilderPage.tsx`, `pages/TournamentBracketPage.tsx`, `components/LiveMatchOverlay.tsx`, `pages/CatalogHistoryPage.tsx`, `components/PlayerCard.tsx`.
- **Frontend (Canchas)**: `pages/B2bApp.tsx` (+ `StaffView`/`RealClientView` y subvistas), `components/b2b/*`, `index.css` (bloques `.b2b-*` y media queries).
- **Estilos**: `apps/client/src/index.css` (tokens/utilities y media queries; se reemplazan/ajustan los breakpoints actuales de `.b2b-*`).
- **Sin cambios** de backend, API, base de datos ni dependencias nuevas.
- **Referencias de diseño**: `stitch_elite_football_squad_builder/diseño_mobile/...` (8 mockups) — insumo, no código en runtime.
