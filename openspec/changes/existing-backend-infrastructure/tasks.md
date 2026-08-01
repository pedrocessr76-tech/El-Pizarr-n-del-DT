## 1. Data Model (Backend)

- [x] 1.1 Crear entidad Player con id, name, nationality, position, rating, stats (pace, shooting, passing, dribbling, defending, physical)
- [x] 1.2 Crear entidad Team con id, name, userId
- [x] 1.3 Crear entidad TeamPlayer con id, teamId, playerId, isStarter, slotIndex
- [x] 1.4 Crear entidad Match con id, tournamentId, round, userId, homeTeamId, awayTeamId, homeScore, awayScore, status, winnerId
- [x] 1.5 Crear entidad User con id, username, password, createdAt
- [x] 1.6 Configurar TypeORM con better-sqlite3 y synchronize:true

## 2. User Auth (Backend)

- [x] 2.1 Implementar POST /auth/register con bcrypt + JWT
- [x] 2.2 Implementar POST /auth/login con validación de credenciales
- [x] 2.3 Implementar GET /auth/profile con JWT guard
- [x] 2.4 Configurar Passport JWT strategy con expiración 7 días

## 3. Player Catalog (Backend)

- [x] 3.1 Seedear 25 jugadores mock al iniciar servidor
- [ ] 3.2 Implementar GET /players con listado y filtros por nombre/posición

## 4. Draft Mode (Backend)

- [x] 4.1 Implementar GET /draft/pack (5 jugadores aleatorios)
- [x] 4.2 Implementar POST /draft/select (verificar jugador existe)
- [ ] 4.3 Validar tamaño máximo de equipo antes de seleccionar

## 5. Team Building (Backend)

- [x] 5.1 Implementar POST /draft/team (crear equipo vacío)
- [x] 5.2 Implementar POST /draft/team/player (agregar jugador, máx 11 titulares)
- [x] 5.3 Implementar DELETE /draft/team/:teamId/player/:playerId (quitar jugador)
- [ ] 5.4 Implementar validación de 18 jugadores (11 titulares + 7 suplentes)
- [ ] 5.5 Implementar gestión de suplentes (isStarter=false)

## 6. Match Generation (Backend)

- [x] 6.1 Implementar POST /match/tournament/create (crear torneo con 15 equipos IA)
- [x] 6.2 Implementar POST /match/tournament/simulate-match (simular y persistir)
- [x] 6.3 Implementar GET /match/tournament/:id (consultar torneo)
- [x] 6.4 Implementar GET /match/team/:id (consultar equipo con jugadores)
- [ ] 6.5 Implementar lógica de progresión de bracket (OCTAVOS→CUARTOS→SEMIS→FINAL)
- [ ] 6.6 Implementar escalado de dificultad según media de rating
- [ ] 6.7 Implementar desempate (penales) para partidos empatados

## 7. Game State (Backend) — PENDIENTE

- [ ] 7.1 Implementar endpoint de resumen de partido con calificaciones
- [ ] 7.2 Implementar retroalimentación de preparación del equipo
- [ ] 7.3 Implementar historial de partidos por usuario

## 8. Frontend — PENDIENTE

- [ ] 8.1 Implementar pantalla de Login/Registro con validaciones
- [ ] 8.2 Implementar pantalla Hub principal con navegación
- [ ] 8.3 Implementar pantalla de Selección de Formación
- [ ] 8.4 Implementar pantalla de Selección de Capitán
- [ ] 8.5 Implementar pantalla de Draft Room con apertura de sobres
- [ ] 8.6 Implementar pantalla de Match Center con bracket de torneo
- [ ] 8.7 Implementar pantalla de Copa del DT
- [ ] 8.8 Implementar store de estado global con Zustand
- [ ] 8.9 Implementar API client con fetch y manejo de JWT
