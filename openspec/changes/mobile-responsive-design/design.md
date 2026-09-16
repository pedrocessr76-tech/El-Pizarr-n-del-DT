## Context

La app es un monorepo con dos superficies de UI que comparten `index.css`:

- **Juego (El Pizarrón del DT)**: `App.tsx` (tabs `home | builder | catalog | bracket | history`), `Navbar.tsx` (barra superior con pestañas `hidden md:flex`), páginas `HomePage`, `TeamBuilderPage` (1151 líneas, cancha vertical + armado + overlay de sobre + modal de preparación de partido), `CatalogHistoryPage` (toggle Historial/Catálogo), `TournamentBracketPage` + `LiveMatchOverlay`/`DefeatOverlay`. Tema oscuro Material-3-like (`--color-primary:#a5d0b9` mentol sobre `#0b1326`).
- **Sistema Canchas (B2B)**: `B2bApp.tsx` con vistas `login | dashboard | settings | availability | bookings | portal`, un sidebar fijo de 244px y CSS propio (`.b2b-*`) con breakpoints a `1000px`/`720px`. Tema claro (`--b2b-canvas:#f8fafc`, verde `#15803d`).

Stitch entregó 8 mockups mobile (`stitch_elite_football_squad_builder/diseño_mobile/.../`) con dos familias de shell: juego (header fijo + bottom nav de 5 tabs, oscuro) y Canchas (header fijo + bottom nav de 4 tabs, claro). Sus datos/valores están hardcodeados y desactualizados respecto de la app real. Este documento define **cómo** llevar ese lenguaje mobile a la app actual sin reescribirla.

Restricciones: sin backend/datos nuevos; desktop debe quedar intacto; reusar stores/servicios reales; no introducir dependencias.

## Goals / Non-Goals

**Goals:**
- Que en teléfonos (< `md`, 768px) el juego tenga navegación completa (bottom tab bar) y cada pantalla se adapte al ancho con el lenguaje de Stitch.
- Que Canchas use en mobile un header fijo + bottom nav de 4 tabs + hojas/barras flotantes, en vez del sidebar deslizable y las tablas anchas.
- Reusar datos reales (equipo/draft, torneo, jugadores, reservas) y los tokens actuales; nada de valores hardcodeados de los mockups.
- Taps accesibles (≥44px), safe-area insets, scroll táctil fluido, sin `alert()`.

**Non-Goals:**
- Re-tematizar los colores (se conserva la identidad actual; no se adopta el neón esmeralda exacto de Stitch ni se cambia el tema claro de Canchas).
- Cambiar el modelo de datos, la API o la lógica de negocio.
- Implementar un `screen.png` pixel-perfect; se adapta la estructura/UX priorizando la app real.
- Gestos nativos complejos (swipe-navigation, drag & drop nuevo) fuera de lo ya existente.
- Rediseñar el desktop (los breakpoints `≥ md` deben quedar funcionalmente iguales).

## Decisions

### 1. Shell mobile-only con breakpoint `md`, desktop intacto
Se renderizan `MobileTopBar` + `MobileTabBar` **solo** en `< md` y la `Navbar` desktop se mantiene oculta en mobile (como hoy). Se usa render condicional por CSS (`md:hidden` / `hidden md:*`) más estilos fijos, sin duplicar el markup de las páginas.
- **Por qué**: mínimo riesgo de regresión en desktop y una sola fuente de verdad de navegación.
- **Alternativa descartada**: reescritura mobile-first de toda la app (costo y riesgo altos).

### 2. Componentes de shell compartidos, parametrizados por superficie
`components/layout/MobileTopBar.tsx` y `components/layout/MobileTabBar.tsx` reciben `variant: 'game' | 'canchas'`, lista de tabs y acción de usuario. El juego usa tema oscuro y 4 destinos; Canchas usa tema claro y 4 tabs.
- **Mapeo de tabs del juego** (a los destinos reales de hoy, no a los 5 de Stitch): `Inicio → home`, `Formación y Equipo → builder`, `Historial y Cartas → catalog` (incluye toggle a historial), `Copa Élite → bracket`. (Stitch tenía Táctica/Equipo separados; en la app son una sola página — se unifican en "Formación y Equipo".)
- **Mapeo de tabs de Canchas**: `Reservar → portal`, `Mis Turnos → bookings (client)/reservas propias`, `Operativa → dashboard`, `Perfil → login/perfil`. Se respeta `isStaff` (para staff, "Operativa" = dashboard y "Reservar" deshabilitado/oculto).
- **Por qué**: respeta la estructura real de la app y evita pestañas que apunten a la misma pantalla.

### 3. Adaptación por pantalla reusando stores y subvistas existentes
Cada pantalla grande se ajusta con clases responsive (Tailwind `md:`) y wrappers mobile; no se crean rutas nuevas.

- **Juego**
  - `HomePage`: en mobile, header con título + acceso a login/avatar, CTA **JUGAR** primaria de ancho completo, acciones secundarias Historial/Mis Cartas y (si hay equipo) una tarjeta resumen de plantilla con datos de `useDraftStore`. Las tarjetas `h-64` fijas pasan a `h-auto` en mobile.
  - `TeamBuilderPage`: cancha vertical escalada a `aspect-[2/3]` con `max-w` mobile, HUD de formación/stats, **banca de suplentes como strip horizontal** (`overflow-x-auto`), control segmentado de dificultad (`Principiante/Profesional/Leyenda`) y **barra "Continuar" fija** sobre el bottom nav. El modal de preparación de partido pasa a **bottom sheet**. (Coincide con el requerimiento `team-building` de cancha vertical.)
  - `TournamentBracketPage` + `LiveMatchOverlay`: banner "EN VIVO", selector de ronda segmentado, tarjeta de partido destacada, "centro de partido" y botones de órdenes táctica en mobile; se reemplazan los `alert()` por estados inline (o el toast existente).
  - `CatalogHistoryPage`: filtros colapsables/hoja inferior en mobile y grilla `grid-cols-2`; header y toggle Historial/Catálogo compactos.

- **Canchas** (`B2bApp.tsx`)
  - **Login/Perfil**: adaptar `B2bLogin` a full-screen mobile (brand header, selector de perfil ya existente en 2 columnas → tabs/segmento, formularios con `.b2b-input` a ≥44px). Se conservan las 4 identidades actuales (Owner/Admin/Operator/Client).
  - **Portal (cliente)**: selector de fecha (chips), filtros (pills horizontal), toggle de duración, tarjetas de cancha con franja horaria (`overflow-x-auto`) y **hoja resumen flotante** sobre el nav que avanza al pago.
  - **Pago/Seña**: indicador de pasos, resumen de reserva con contador, radios de modalidad y medio de pago, formulario del titular y **barra de checkout fija**. Se conecta a `b2bService` real (mismos endpoints que hoy).
  - **Dashboard (staff)**: grilla KPI 2×2 (`OperationalMetrics`), barra de acciones, "Próximos a iniciar", "Solicitudes online" y "Cierre de caja", reusando `StaffView`/`b2bService`.
  - **`alert()` existentes** (dashboard/torneo) se reemplazan por feedback inline/toast.

### 4. Patrones táctiles y CSS
- Barras fijas inferiores: `position: fixed; bottom: calc(64px + env(safe-area-inset-bottom));` con `backdrop-blur`.
- Bottom sheets: overlay `fixed inset-0 bg-black/60 items-end` con panel redondeado y `max-h-[85dvh] overflow-y-auto`.
- `viewport-fit=cover` ya está en `index.html` (PWA); se agregan `pt-safe`/`pb-safe` como utilidades.
- Zonas de alcance del pulgar: CTAs primarias cerca del borde inferior; navegación primaria en el bottom nav.
- Se mantienen `body { overflow-x: hidden }` y el `-webkit-overflow-scrolling: touch` ya presentes; el contenido de páginas mobile reserva `pb-24` para no tapar con el nav.

### 5. Conservar tokens y no tocar `screen-flow`
- Se conservan las paletas actuales (oscuras del juego, claras de Canchas). Las utilidades/tokens nuevos se agregan en `index.css` sin alterar los existentes.
- **No se modifica el spec `screen-flow`** para evitar solapamiento con el change abierto `sistema-canchas-saas` (que también tiene un delta de `screen-flow`). La navegación mobile se especifica como capacidad nueva `mobile-app-shell`.

## Risks / Trade-offs

- **Doble shell (desktop + mobile) → duplicación de navegación** → Mitigación: un único `MobileTopBar`/`MobileTabBar` parametrizado y render condicional; las páginas no se duplican, solo sus layouts.
- **`TeamBuilderPage` es grande y sensible (armado/capitán/validación 11+7)** → Mitigación: cambios acotados a estructura/estilos mobile; no tocar la lógica de slots/draft; verificación manual de los flujos existentes.
- **Solapamiento con change abierto `sistema-canchas-saas`** → Mitigación: no editar specs compartidos (`screen-flow`); el delta de Canchas vive en `canchas-mobile-screens` y toca solo presentación.
- **Regresión en desktop** → Mitigación: estilos mobile tras `md:`; checklist de verificación en desktop en la fase de QA.
- **Datos reales vs mocks de Stitch** (OVR/química/nombres) → Mitigación: usar `useDraftStore`/`useAuthStore`/servicios; si un dato no existe, mostrar estado vacío en vez de inventarlo.
- **Rendimiento en móvil** (blur + animaciones) → Mitigación: reusar patrones ya presentes; evitar animaciones nuevas costosas; respetar `prefers-reduced-motion` si aplica.

## Migration Plan

1. Tokens/utilidades + shell mobile del juego; verificar desktop sin cambios.
2. Pantallas del juego (Home → armado/formación → torneo → catálogo).
3. Shell + pantallas de Canchas (login → portal → pago → dashboard).
4. QA responsive (mobile real/DevTools) y build.
   - **Rollback**: cambios de UI sin migración de datos; revertir los componentes/commits revierte el comportamiento. Sin pasos de datos.

## Open Questions

- Breakpoint de corte definitivo (se asume `< 768px` = `md`); ¿alinear los breakpoints actuales de `.b2b-*` (1000/720) a `md` para consistencia?
- ¿El login de Canchas debe soportar las 4 identidades actuales en mobile o basta con Jugador/Admin como en el mockup?
- ¿"Mis Turnos" para el cliente tiene vista propia hoy o reusa `bookings`? (impacta el mapeo del tab).
