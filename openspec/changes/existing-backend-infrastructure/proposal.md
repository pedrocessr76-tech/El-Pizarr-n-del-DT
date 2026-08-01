## Why

Documentar la infraestructura backend existente (NestJS + TypeORM + SQLite) como línea base para futuros cambios. El backend tiene entidades, autenticación JWT, draft, torneos y seed de datos funcionando pero sin validaciones completas ni frontend.

## What Changes

- Crear specs que capturen el estado actual de cada módulo backend
- Definir qué validaciones y lógica de negocio faltan por implementar
- Establecer línea base para construir el frontend React

## Capabilities

### New Capabilities
- `data-model`: Entidades Player, Team, TeamPlayer, Match, User con TypeORM + SQLite
- `user-auth`: Registro, login con JWT (7 días), perfil protegido
- `player-catalog`: Catálogo de 25 jugadores seedeados con atributos
- `draft-mode`: Apertura de sobre (5 jugadores aleatorios), selección, equipo
- `team-building`: CRUD de equipos (crear, agregar/quitar jugadores)
- `match-generation`: Creación de torneo, simulación de partidos, 15 equipos IA
- `game-state`: Resumen de partido y retroalimentación de estado del equipo (PENDIENTE)

### Modified Capabilities
- (ninguna — es la primera version)

## Impact

- Backend: NestJS + TypeORM + SQLite funcionando en puerto 3001
- Frontend: Vite + React + Tailwind configurado, sin componentes implementados
- Seed automático con 25 jugadores mock + equipos Premier League
- shared/types con interfaces compartidas (Player, Team, Match, Tournament)
