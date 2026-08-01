## Context

Backend NestJS con TypeORM + SQLite funcionando en puerto 3001 con 5 entidades, autenticación JWT, draft, torneos y seed. Frontend Vite + React configurado pero sin componentes. Se documenta la arquitectura actual como línea base.

## Goals / Non-Goals

**Goals:**
- Documentar estructura de módulos NestJS (auth, draft, match, player, team, user, seed)
- Capturar endpoints API existentes con sus firmas
- Definir validaciones faltantes vs OpenSpec original
- Establecer línea base para frontend

**Non-Goals:**
- No implementar nuevo código
- No modificar la arquitectura existente

## Decisions

- **TypeORM con better-sqlite3**: Base de datos embebida, sin servidor externo, sincronización automática de esquemas
- **JWT sin refresh token**: Token con expiración de 7 días almacenado en localStorage
- **Seed automático**: 25 jugadores mock + 15 equipos Premier League cargados al iniciar el servidor
- **Módulos feature**: Cada dominio (auth, draft, match) tiene su propio controller, service y module
- **Entidades separadas**: Player, Team, TeamPlayer, Match, User — cada una en su propio archivo .entity.ts

## Risks / Trade-offs

- [SQLite embebida] → No apto para múltiples instancias, pérdida de datos al borrar archivo
- [Sin migraciones] → `synchronize: true` permite cambios rápidos pero riesgo en producción
- [Sin refresh token] → Si el token se compromete, válido por 7 días
- [Endpoints públicos] → Draft y match no requieren autenticación JWT
