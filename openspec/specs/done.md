# Implementado — Línea Base

## Data Model

- Player: id (UUID), name, nationality, position (GK|DEF|MID|FWD), rating, stats (pace/shooting/passing/dribbling/defending/physical 1-99)
- Team: id (UUID), name, userId (nullable)
- TeamPlayer: team-player M:N con isStarter, slotIndex
- Match: tournamentId, round, userId, homeTeamId, awayTeamId, homeScore, awayScore, status (PENDING|FINISHED), winnerId
- User: id (UUID auto), username (único), password (bcrypt), createdAt

## User Auth

- POST /auth/register → bcrypt hash + JWT
- POST /auth/login → validación + JWT (7 días exp)
- GET /auth/profile → JWT guard, devuelve id/username/createdAt

## Player Catalog

- Seed automático: 25 jugadores (Messi, Mbappé, Haaland, etc.) al iniciar servidor

## Draft Mode

- GET /draft/pack → 5 jugadores aleatorios del catálogo

## Team Building

- POST /draft/team → crear equipo vacío
- POST /draft/team/player → agregar jugador (máx 11 titulares)
- DELETE /draft/team/:teamId/player/:playerId → quitar jugador

## Match Generation

- POST /match/tournament/create → torneo 16 equipos (1 user + 15 IA)
- POST /match/tournament/simulate-match → simular y persistir resultado
- GET /match/tournament/:id → consultar bracket
- GET /match/team/:id → consultar plantilla

## Frontend

- Nada implementado. Solo `main.tsx` placeholder.
