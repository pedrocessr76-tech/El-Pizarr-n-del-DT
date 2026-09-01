# 🎨 Prompt para Google Stitch — Overlay "Minuto a Minuto" (LiveMatchOverlay)

> **Uso:** Copia el prompt completo (o solo la sección que necesites) y pégsto en [Google Stitch](https://stitch.google.com).  
> **Proyecto:** [El Pizarron del DT](https://github.com/pedrocessr76-tech/El-Pizarr-n-del-DT)  
> **Componente referencia:** `apps/client/src/components/LiveMatchOverlay.tsx`

---

## 1. Sistema de diseño (contexto obligatorio)

Incluye siempre este bloque al inicio de tu prompt para que Stitch respete la identidad visual:

```
[STITCH][Squad Builder Style Guide]
Nombre del producto: "El Pizarron del DT" — gestor de torneos de fútbol estilo Fantasy/Premier League.
Brand personality: autoridad táctica, precisión, premium — como un scouting tool profesional con la élite del fútbol.

Color palette (Material 3 Dark, estilo "Corporate Tactical"):
- Background / Surface: #0b1326 (verde carbón profundo) → #171f33 (surface-container)
- Surface Container High: #222a3d
- Surface Container Low: #131b2e
- Surface Container Lowest: #060e20
- Primary (acción/tiro): #a5d0b9 (turquesa menta)
- On Primary: #0e3727
- Primary Container: #1b4332
- Secondary: #b5ccc0 (verde grisáceo)
- Tertiary (gol/campo): #e9c349 (dorado/bronce metálico)
- On Tertiary: #3c2f00
- Error: #ffb4ab (rojo vivo)
- On Error: #690005
- Outline: #8b938d
- Outline Variant: #414844
- On Surface: #dae2fd (texto principal)
- On Surface Variant: #c1c8c2 (textos secundarios)

Tipografía:
- Montserrat (Bold/ExtraBold/Black) para headlines, scores, ratings, labels en mayúsculas.
- Inter (Regular/Medium/SemiBold) para cuerpo, comentarios, estadísticas.
- Estilo "player nameplate": labels en mayúsculas con letter-spacing (0.05em) y font-weight 600.

Elevación y profundidad:
- Nivel 0 (Cancha): fondo de cancha #081C15 → #1B4332 (degradado vertical).
- Nivel 1 (Cards/Panels): tono surface-container-high (#222a3d) con borde interior 1px rgba(255,255,255,0.1).
- Nivel 2 (Overlays/Modales): backdrop-blur 20px, fondo rgba(11,19,38,0.85).
- Sombras "Deep Field": 0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4).
- Glassmorphism: bordes superior e izquierdo con "light leak" 1px rgba(255,255,255,0.1).

Formas: bordes redondeados (0.5rem estándar, 1rem para cards, píldara para dots de jugadores).
```

---

## 2. Descripción del overlay actual (LiveMatchOverlay)

El overlay es un modal flotante centrado en pantalla con estas secciones:

**Layout general:** max-w-6xl, h-90vh, bg surface-container (#171f33), borde 1px rgba(255,255,255,0.1), border-radius 0.5rem, sombra 2xl. Backdrop blur 20px con overlay bg-background/85.

**Header** (bg-surface-container-high #222a3d, border-b 1px rgba(255,255,255,0.1)):
- Izquierda: ícono "sensors" turquesa (#a5d0b9) animado + texto "EN VIVO" (label-md uppercase) + marcador de minuto (display-lg 48px bold).
- Centro: botones de velocidad x30 / x60 / x90 (toggle activo turquesa sobre surface-variant).
- Derecha: botón "Cambios" con contador + botón "close".

**Marcador** (centrado, px-6 pt-4):
- Badge equipo local: círculo 64x64 iniciales + nombre + score.
- Score: display-lg 48px "0 - 0" con tabular-nums.
- El equipo del usuario resaltado con scale-105 y color turquesa.

**Cancha** (flex-1, cancha con 22 dots animados):
- Fondo degradado #081C15 → #1B4332 (pitch-bg).
- Líneas 0.5px rgba(255,255,255,0.2), círculo central 80x80px, áreas penal.
- 22 dots (18px) en movimiento con easing duration-700. Turquesa para usuario, surface-variant para rival.

**Estadísticas** (grid grid-cols-2): posesión (barras), tiros, a puerta.

**Comentarios en vivo** (w-96): feed de eventos con minute marker (font-stat-value 22px), dorado para goles, turquesa para comentarios.

---

## 3. Prompt principal para Stitch (plantilla genérica)

```stitch
[STITCH][El Pizarron del DT]
Genera una imagen de UI para el overlay de "minuto a minuto" de un partido de fútbol en vivo. App: gestor de torneos estilo Fantasy. Sistema de diseño dark theme: background #0b1326, surface #171f33, surface-container-high #222a3d, primary turquesa #a5d0b9, tertiary dorado #e9c349, error #ffb4ab. Tipografía Montserrat (headers/bold) e Inter (cuerpo). Glassmorphism con backdrop-blur 20px, "light leak" border 1px rgba(255,255,255,0.1) en top/left, sombra deep field.

[DESCRIBE_QUÉ_MODIFICAR]

Muestra el overlay completo: header con "EN VIVO" + marcador minuto + botones velocidad x30/x60/x90 + botón Cambios, marcador con dos team badges y score, cancha de fútbol con 22 dots de jugadores (11 por equipo) en formación, estadísticas (posesión/tiros/a puerta) en grid, y panel de comentarios en vivo a la derecha. [DETALLES_EXTRA]

Estilo: fotorealista de UI, 4K, aspecto 16:9, iluminación cinematográfica, depth of field suave.
```

---

## 4. Prompts listos para usar (copiar y pegar)

### Prompt 4.1 — Mejorar la barra de progreso del minuto

```stitch
[STITCH][El Pizarron del DT]
Genera una imagen de UI para el overlay "minuto a minuto" de fútbol en vivo. Sistema de diseño: dark theme, greens profundos (#081C15, #1B4332), turquesa #a5d0b9 primary, dorado #e9c349 tertiary, Montserrat/Inter fonts, glassmorphism con backdrop-blur, "light leak" borders 1px rgba(255,255,255,0.1).

Quiero mejorar la barra de progreso del minuto. En lugar del simple marcador numérico "0'", necesito una barra de progreso horizontal de 90 minutos integrada en el header. La barra debe:
- Track: height 6px, bg rgba(255,255,255,0.15), borderRadius 9999px.
- Fill: gradiente turquesa #a5d0b9 → dorado #e9c349, width según minuto (ej: minuto 45 = 50%).
- Ticks: 0', 15', 30', 45', 60', 75', 90' como líneas finas con texto font-label-md text-xs text-on-surface-variant/40.
- Indicador actual: dot de 10px en posición del minuto, color turquesa #a5d0b9, box-shadow 0 0 10px rgba(165,208,185,0.5).

Muestra el overlay completo con esta barra integrada en el header (donde dice "EN VIVO" + minuto 45'). La cancha con 22 dots, marcador, estadísticas y comentarios deben seguir visibles. Fotorealista UI, 4K, aspect 16:9.
```

### Prompt 4.2 — Añadir efecto de "flash" al anotar un gol

```stitch
[STITCH][El Pizarron del DT]
Genera una imagen de UI para el overlay de minuto a minuto de fútbol. Style: dark theme, greens profundos (#081C15, #1B4332), turquesa #a5d0b9 primary, dorado #e9c349 tertiary, Montserrat/Inter, glassmorphism, light leak borders.

Quiero un efecto visual dramático cuando se anota un gol:
- Destello radial centrado en el arco rival: radial-gradient #e9c349/30 → transparente.
- "goal flash" overlay dorado #e9c349 opacity 15% cubriendo toda la cancha.
- Dots del equipo que anota con anillo pulsante #e9c349, ring-2, animate-pulse.
- Score aumentado y bold en dorado #e9c349, text-shadow 0 0 15px rgba(233,195,73,0.5).
- Banner "¡GOL!" flotante: gradiente #cba72f → #e9c349, texto negro Montserrat Bold, border-radius 8px, box-shadow 0 0 30px rgba(233,195,73,0.6), arriba del marcador.

Muestra el overlay completo con el efecto de gol activado (minuto ~78', score 2-1). Fotorealista UI, 4K, aspect 16:9.
```

### Prompt 4.3 — Reemplazar dots con mini-cards de jugador

```stitch
[STITCH][El Pizarron del DT]
Genera una imagen de UI para el overlay de minuto a minuto de fútbol. Dark theme: #0b1326 bg, #a5d0b9 turquesa primary, #e9c349 dorado tertiary, Montserrat Bold headers, Inter cuerpo. Glassmorphism con backdrop-blur y light leak borders.

Reemplaza los dots de jugadores (18px círculos con iniciales) por mini-cards de jugador. Cada dot debe mostrar:
- Círculo 24x24px con iniciales, bg turquesa #a5d0b9 para usuario (ring dorado #e9c349 ring-2 si anotó), bg surface-variant #2d3449 para rival.
- Tooltip flotante: nombre (Montserrat Bold 12px), posición (Inter 10px), rating (Montserrat ExtraBold 10px, dorado #e9c349). Tooltip con bg-surface-container-high #222a3d, borde 1px rgba(255,255,255,0.1), border-radius 8px, backdrop-blur, flecha apuntando al dot.

Muestra la cancha con 22 mini-cards en formación 4-3-3 vs 4-2-3-1, 2 tooltips visibles. Mantén header, marcador, stats, comentarios. Fotorealista UI, 4K, aspect 16:9.
```

### Prompt 4.4 — Rediseñar header con branding de transmisión

```stitch
[STITCH][El Pizarron del DT]
Diseña un header de transmisión de TV para el overlay de "minuto a minuto" de fútbol. Estilo: sports broadcast premium (como ESPN/DAZN). Dark theme: bg #0b1326, surface-container #171f33, surface-container-high #222a3d, turquesa #a5d0b9 primary, dorado #e9c349 tertiary. Tipografía Montserrat/Inter.

El header debe incluir:
- Logo "El Pizarron del DT" con gradiente turquesa #a5d0b9 → dorado #e9c349, Montserrat Black uppercase, icono silbataza de fútbol a la izquierda.
- Badge "EN VIVO" con punto rojo #ff4444 parpadeando, texto label-md uppercase tracking-widest, bg-error-container #93000a.
- Marcador de minuto display-lg 48px #dae2fd con tabular-nums, icono reloj pequeño.
- Botones velocidad (x30/x60/x90) estilo pills, activo en dorado #e9c349.
- Botón sustituciones con contador "5" en badge rojo #ff4444.
- Botón cerrar con hover effect.

Todo con glassmorphism, backdrop-blur 20px, "light leak" border 1px rgba(255,255,255,0.1) en top/left, sombra deep field. Fotorealista UI, 4K, aspect 16:9.
```

### Prompt 4.5 — Añadir barra de energía/condición de jugadores

```stitch
[STITCH][El Pizarron del DT]
Genera una imagen de UI para el overlay de minuto a minuto de fútbol. Dark theme: bg #0b1326, greens #081C15→#1B4332, turquesa #a5d0b9 primary, dorado #e9c349 tertiary. Montserrat Bold headers, Inter cuerpo. Glassmorphism, light leak borders.

Añade una barra de energía/condición en la parte inferior del overlay:
- 22 segmentos (11 por equipo) con mini-cards horizontales.
- Cada segmento: iniciales (Montserrat Bold 10px), barra de energía 3px height con width según condición, gradiente #a5d0b9 → #e9c349.
- Equipo usuario: bg turquesa #a5d0b9/15, border 1px rgba(165,208,185,0.3).
- Equipo rival: bg surface-variant #2d3449/15, border 1px rgba(61,81,73,0.3).
- Separador con texto "VS" en dorado #e9c349.
- Indicador "ADVERTENCIA" amarilla #ffc107 para energía < 40%.

Barra en parte inferior, bg-surface-container-high #222a3d, border-t 1px rgba(255,255,255,0.1). Mantén resto del overlay visible. Fotorealista UI, 4K, aspect 16:9.
```

---

## 5. Guía rápida de variaciones

| Necesidad | Qué cambiar en el prompt |
|---|---|
| **Solo modificar la cancha** | Decir "Modifica solo la cancha del overlay, mantén header y marcador iguales" |
| **Cambiar tema de colores** | Reemplazar `#a5d0b9` (turquesa) y `#e9c349` (dorado) por los nuevos primary/tertiary |
| **Añadir nuevo elemento** | "Añade un [elemento] en la sección [X] con estilo [Y]" |
| **Cambiar estado del partido** | Especificar "minuto 45", "score 2-1", "efecto de gol activado" |
| **Estilo más gráfico/cinemático** | Añadir "sports broadcast premium", "iluminación cinematográfica", "depth of field suave" |

**Variables de plantilla (reemplaza `[...]":**
- `[DESCRIBE_QUÉ_MODIFICAR]` — la descripción detallada del cambio
- `[DETALLES_EXTRA]` — detalles de posición, estado del partido, colores específicos
- `[ESTADO_PARTIDO]` — minuto, score, si hay gol reciente

---

## 6. Recomendaciones para Stitch

- **Sé específico con colores hex** — Stitch no conoce tu sistema de diseño, incluye siempre valores hex.
- **Menciona el estilo visual** — "sports broadcast premium", "glassmorphism", "Material 3 Dark", "cinematic lighting".
- **Incluye resolución y aspecto** — "4K", "aspect 16:9", "fotorealista UI".
- **Describe interacciones** — hover states, animations, efectos de glow/pulse.
- **Mantén coherencia** — siempre incluye referencias al resto del overlay para contexto.
- **Itera** — Stitch permite refinar; si el primer resultado no es perfecto, usa el feedback para ajustar.