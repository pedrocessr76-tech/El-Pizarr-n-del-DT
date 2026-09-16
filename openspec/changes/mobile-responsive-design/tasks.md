## 1. Fundaciones (tokens y shell mobile del juego)

- [x] 1.1 Agregar en `apps/client/src/index.css` las utilidades/tokens mobile: `pt-safe`/`pb-safe`, altura del bottom nav (`--mobile-nav-h: 64px`), padding inferior de contenido y reglas de bottom sheet; sin alterar los tokens existentes.
- [x] 1.2 Crear `apps/client/src/components/layout/MobileTopBar.tsx` parametrizado (`variant: 'game' | 'canchas'`, título, marca, acciones de usuario), fijo, con `pt-safe` y `backdrop-blur`.
- [x] 1.3 Crear `apps/client/src/components/layout/MobileTabBar.tsx` parametrizado (tabs con ícono+etiqueta, activo con `aria-current`, `pb-safe`, `backdrop-blur`, taps ≥44px).
- [x] 1.4 Integrar el shell mobile del juego en `App.tsx` (4 tabs reales: Inicio/Formación y Equipo/Historial y Cartas/Copa Élite) sin romper la `Navbar` desktop; ajustar `pb` del contenido.
- [x] 1.5 Verificar que en desktop (`≥ md`) la navegación y el layout actuales no cambien.

## 2. Juego — pantallas mobile

- [x] 2.1 Adaptar `HomePage.tsx`: header mobile, CTA JUGAR de ancho completo, acciones secundarias, tarjetas `h-auto` y tarjeta de resumen de plantilla con datos de `useDraftStore` (o estado vacío si no hay equipo).
- [x] 2.2 Adaptar `TeamBuilderPage.tsx`: cancha vertical `aspect-[2/3]` escalada, HUD de formación/stats, banca como strip horizontal, dificultad segmentada y barra **Continuar** fija; conservar capitán y validación 11+7.
- [x] 2.3 Convertir el modal de preparación de partido (`showMatchPrepOverlay`) en bottom sheet mobile.
- [x] 2.4 Adaptar `TournamentBracketPage.tsx` + `LiveMatchOverlay.tsx`: banner "En Vivo", selector de ronda segmentado, tarjeta de partido y controles de órdenes tácticas sin desbordes.
- [x] 2.5 Reemplazar los `alert()` del torneo/fin de partido por feedback inline o toast existente.
- [x] 2.6 Adaptar `CatalogHistoryPage.tsx`: grilla 2 columnas, filtros táctiles/desplegables y tabla de historial legible (tarjetas o scroll interno) en mobile.

## 3. Canchas — shell y pantallas mobile

- [x] 3.1 Integrar el shell mobile de Canchas en `B2bApp.tsx` (header con complejo activo + bottom nav de 4 tabs: Reservar/Mis Turnos/Operativa/Perfil, según `isStaff`), ocultando el sidebar en mobile.
- [x] 3.2 Adaptar `B2bLogin` a full-screen mobile (marca, selector de perfil táctil, inputs ≥44px) conservando las identidades y el flujo de `b2bService`.
- [x] 3.3 Adaptar el portal de reservas del cliente: selector de fecha en chips, filtros en pills, duración segmentada, tarjetas de cancha con franja horaria deslizable y hoja resumen flotante que avanza al pago.
- [x] 3.4 Adaptar la pantalla de pago/seña: indicador de pasos, resumen con contador, radios de modalidad/medio, datos del titular y barra de checkout fija conectada a los servicios existentes.
- [x] 3.5 Adaptar el dashboard operativo del staff: grilla KPI, barra de acciones, próximos a iniciar, solicitudes online y cierre de caja, reusando `StaffView`/`b2bService`.
- [x] 3.6 Reemplazar los `alert()` del dashboard por feedback inline/toast.
- [x] 3.7 Alinear/corregir los breakpoints de `.b2b-*` en `index.css` para coherencia con el shell mobile.

## 4. Verificación

- [ ] 4.1 QA responsive en mobile (DevTools ~375px y 414px): header/nav fijos, safe-area, contenido no tapado, sin scroll horizontal en las 8 pantallas.
- [ ] 4.2 QA de no-regresión en desktop: navegación superior del juego y layout con sidebar de Canchas intactos.
- [ ] 4.3 Verificar flujos funcionales intactos: armado 11+7 y avance al torneo, login/registro, selección de turno → pago, aprobar/rechazar/cobrar en dashboard.
- [x] 4.4 Ejecutar build completo del repo (`npm run build`) y `openspec validate` del change.
