# Pendiente — Próximos Pasos

## Backend

### Player Catalog
- GET /players con listado y filtros por nombre/posición

### Draft Mode
- Validar tamaño máximo de equipo antes de seleccionar (18 jugadores)

### Team Building
- Validación 18 jugadores (11 titulares + 7 suplentes)
- Gestión de suplentes (isStarter=false)

### Match Generation
- Lógica de progresión de bracket (OCTAVOS → CUARTOS → SEMIS → FINAL)
- Escalado de dificultad según media de rating del oponente
- Desempate (penales) para partidos empatados

### Game State
- Endpoint resumen de partido con calificaciones
- Retroalimentación de preparación del equipo
- Historial de partidos por usuario

## Frontend

### Infraestructura
- Store global con Zustand (auth, draft, match state)
- API client con fetch y manejo de JWT
- Tema visual: verdes, blancos, grises, estilo futbolístico simple

### Screens
- **Home**: logo del juego + 3 botones (JUGAR grande y destacado, los otros dos izquierda/derecha) + icono login top-right
- **Login overlay**: cartel "Iniciar Sesión" visible, campos simples, se abre sobre la Home
- **Catálogo de cartas**: grilla de todos los jugadores con filtro por posición y búsqueda
- **Historial de partidas**: lista de torneos anteriores del usuario
- **Elección de Formación**: selección visual entre formaciones disponibles
- **Armado de Equipo**: cancha vertical + panel stats + banca + overlay selección de jugadores
- **Contenedor dificultad**: vertical con stats equipo arriba + botón JUGAR + selector dificultad abajo (Normal por defecto). No es pantalla separada.
- **Partido en vivo**: contenedor con simulación minuto a minuto a velocidad x30/x60/x90, marcador dinámico, notificación de goles
- **Torneo Completo**: bracket moderno y profesional con rondas y ganadores resaltados

### Componentes
- **Carta de jugador**: estilo FIFA Ultimate Team — fondo degradado con patrón, silueta genérica, bandera, posición, nombre, rating grande, 6 stats con barras
- **Niveles de carta**: Bronce (<60), Plata (60-80), Oro (>80) con colores distintivos
- **Overlay de selección**: contenedor con 5 cartas horizontales para elegir jugador/capitán
- **Cancha vertical**: slots por posición según formación, sin scroll
- **Panel de stats**: rating medio del equipo, química
- **Banca**: 7 slots de suplentes

### Navegación
- Sin menú ni barra de navegación
- Solo botones de acción en el flujo
- Botón "Atrás" explícito para retroceder un paso
- Login no obligatorio, icono en top-right
