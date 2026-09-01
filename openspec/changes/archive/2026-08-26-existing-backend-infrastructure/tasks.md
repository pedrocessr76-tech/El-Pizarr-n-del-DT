## 1. Data Model (Backend)

- [x] 1.1 Crear entidades Player, Team, TeamPlayer, Match, User con TypeORM
- [x] 1.2 Crear entidad Tournament (nueva) con status y currentRound
- [x] 1.3 Migrar de SQLite a PostgreSQL (driver `pg`) con TLS opcional
- [x] 1.4 Agregar `sessionId` e `isReal` a Team, y `sessionId` a Match

## 2. User Auth (Backend)

- [x] 2.1 POST /auth/register con bcrypt + JWT (7 días)
- [x] 2.2 POST /auth/login con validación de credenciales
- [x] 2.3 GET /auth/profile protegido por JWT guard

## 3. Player Catalog (Backend)

- [x] 3.1 Sincronizar catálogo/equipos reales desde `Jugadores_Base_de_Datos` al iniciar servidor
- [x] 3.2 GET /players (listado completo, ordenado por rating desc)
- [ ] 3.3 GET /players con filtros de nombre/posición server-side (hoy filtrado en el cliente)

## 4. Draft Mode (Backend)

- [x] 4.1 GET /draft/pack (5 jugadores aleatorios, con compatibilidad de posiciones FIFA)
- [x] 4.2 POST /draft/select (verifica que el jugador existe)
- [x] 4.3 Soporte de sesión invitado y POST /draft/session/cleanup

## 5. Team Building (Backend)

- [x] 5.1 POST /draft/team (crear/reutilizar equipo vacío)
- [x] 5.2 POST /draft/team/player (agregar jugador, validando 18 = 11 titulares + 7 suplentes)
- [x] 5.3 DELETE /draft/team/:teamId/player/:playerId (quitar jugador)
- [x] 5.4 POST /draft/team/:teamId/reset (vaciar el equipo)

## 6. Match Generation (Backend)

- [x] 6.1 POST /match/tournament/create (torneo 16 equipos, 1 usuario + 15 IA)
- [x] 6.2 POST /match/tournament/simulate-match (simulación por rating + Poisson)
- [x] 6.3 POST /match/tournament/:id/advance (progresión y simulación de llaves IA)
- [x] 6.4 POST /match/tournament/:id/complete (marcar como completado)
- [x] 6.5 GET /match/tournament/:id y GET /match/team/:id
- [x] 6.6 Desempate ponderado (penales) en partidos empatados
- [ ] 6.7 Resumen de partido con calificaciones por jugador (hoy solo resultados y feed de eventos)

## 7. Game State (Backend)

- [x] 7.1 GET /match/history (historial de torneos por usuario)
- [x] 7.2 Estado del torneo (currentRound, status, bracket) vía GET /match/tournament/:id

## 8. Frontend

- [x] 8.1 Store global Zustand (useAuthStore, useDraftStore)
- [x] 8.2 API client con axios y manejo de JWT
- [x] 8.3 Home con logo + 3 acciones (JUGAR, HISTORIAL, CARTAS) y login overlay
- [x] 8.4 Navbar de pestañas (Inicio, Formación y Equipo, Historial y Cartas, Copa Élite)
- [x] 8.5 Armado de Equipo: cancha vertical + banca + selección de formación + capitán
- [x] 8.6 Catálogo de cartas con filtros (posición, rareza, rating min) y búsqueda
- [x] 8.7 Torneo: bracket de 4 rondas con conectores y ganadores resaltados
- [x] 8.8 Partido en vivo con velocidad x30/x60/x90, feed de eventos y goles
- [x] 8.9 Overlay de fin de torneo (derrota) con estadísticas
- [ ] 8.10 Tests automatizados (núcleo de simulación, draft y auth)