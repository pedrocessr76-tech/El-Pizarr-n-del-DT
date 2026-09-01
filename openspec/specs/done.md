# Implementado — Estado Actual

## Data Model

- PostgreSQL (TypeORM) con entidades: Player, Team, TeamPlayer, Match, **Tournament**, User
- Player: id (UUID), name, nationality, position (FIFA: POR/LD/LI/DFC/MCD/MC/MCO/MD/MI/ED/EI/SD/DC/ST), rating y 6 stats (pace/shooting/passing/dribbling/defending/physical, 1-99)
- Team: id (UUID), name, userId (nullable), sessionId (nullable), isReal
- TeamPlayer: team-player M:N con isStarter y slotIndex
- Match: tournamentId, round (OCTAVOS|CUARTOS|SEMIS|FINAL), userId/sessionId, homeTeamId, awayTeamId, homeScore, awayScore, status (PENDING|FINISHED), winnerId
- Tournament: userId/sessionId, userTeamId, status (IN_PROGRESS|COMPLETED), currentRound, createdAt
- User: id (UUID), username (único), password (bcrypt), createdAt

## User Auth

- POST /auth/register → bcrypt + JWT
- POST /auth/login → validación + JWT (7 días)
- GET /auth/profile → JWT guard (id/username/createdAt)
- Frontend: LoginModal overlay con toggle registrarse/iniciar sesión

## Player Catalog

- Sincronización del catálogo al iniciar servidor desde `Jugadores_Base_de_Datos` (equipos reales, `isReal`)
- GET /players (listado completo ordenado por rating)
- GET /players con filtros server-side: `name` (ILIKE), `position` (GK/DEF/MID/FWD), `rarity` (gold ≥85 / silver 75-84 / bronze <75), `minRating` y `maxRating`
- Frontend de catálogo consume los filtros del server (búsqueda con debounce, sin filtrar en el cliente)

## Draft Mode

- GET /draft/pack → 5 jugadores aleatorios (soporta filtro por posición FIFA compatible)
- POST /draft/select → verifica jugador
- Sesión de invitado (sessionId) con limpieza (POST /draft/session/cleanup)

## Team Building

- POST /draft/team (create/reuse) → crear equipo vacío
- POST /draft/team/player → agregar (valida 11 titulares + 7 suplentes = 18)
- DELETE /draft/team/:teamId/player/:playerId → quitar jugador
- POST /draft/team/:teamId/reset → vaciar equipo

## Match Generation

- POST /match/tournament/create → torneo 16 equipos (1 usuario + 15 IA reales)
- POST /match/tournament/simulate-match → simulación ponderada por rating (Poisson) + penales
- POST /match/tournament/:id/advance → progresión de llaves (OCTAVOS→CUARTOS→SEMIS→FINAL)
- POST /match/tournament/:id/complete → marcar torneo completado
- GET /match/tournament/:id, GET /match/team/:id, GET /match/history
- Resumen de partido por jugador (matchRating 1-10, goles ponderados por shooting, asistencias) persistido en cada partido (`summaryJson`)
- Historial enriquecido con detalle individual por partido (calificaciones); en el frontend el partido expande el resumen local/visitante

## Frontend

- Store global Zustand (useAuthStore, useDraftStore)
- API client con axios y manejo de JWT
- Home con logo + 3 acciones + login overlay
- Navbar de pestañas (Inicio, Formación y Equipo, Historial y Cartas, Copa Élite)
- Armado de Equipo: cancha vertical + banca + formación + capitán + dificultad
- Catálogo de cartas FIFA-style con rarezas (Oro ≥85, Plata 75-84, Bronce <75), filtros y búsqueda
- Torneo completo: bracket de 4 rondas con conectores y ganadores resaltados
- Partido en vivo a x30/x60/x90 con feed de eventos y goles
- Cancha con 22 jugadores en movimiento en el overlay de partido en vivo (posición base por zona FIFA, movimiento minuto a minuto sincronizado con la simulación, empuje por posesión y resaltado en gol; refleja las sustituciones)
- Botón "Cambios" en el overlay de partido en vivo: sustituciones en tiempo real (11 titulares ↔ 7 suplentes, máx. 5 por partido, habilitado durante el juego), con registro en el feed y efecto sobre la posesión/tiros del resto del partido
- Notificaciones en tiempo real (WebSocket + socket.io):
  - Backend: @nestjs/websockets + socket.io, gateway con handshake JWT (auth.token) para usuarios o sessionId query para invitados; canal notification:<userId|sessionId>; reconexión automática y limpieza de conexiones. Servicio tipado NotificationPayload.
  - Frontend: NotificationBell en Navbar (badge contador), NotificationPanel (historial agrupado, filtros Todas/No leídas, marcar todo leído, estado vacío, Escape para cerrar), NotificationToast (toasts apilados esquina superior-derecha con barra de progreso y dismiss, variantes por severidad).
  - Store Zustand useNotificationStore y hook useNotificationSocket; montado en App.tsx.
- Overlay de fin de torneo (derrota) con estadísticas

