## Context

Backend NestJS + TypeORM + **PostgreSQL** y frontend React + Vite + Tailwind + Zustand + axios. El juego ya gestiona catálogo de jugadores, armado de equipos, torneos de eliminación directa, autenticación JWT, historial y sesiones de invitado. Este design documenta la arquitectura real actual como línea base.

## Goals / Non-Goals

**Goals:**
- Documentar los módulos NestJS reales (auth, players, team, draft, match, seed, user).
- Capturar los endpoints API existentes con sus firmas y comportamiento.
- Documentar el frontend (stores, servicios, pantallas) y su flujo de navegación.
- Dejar las specs en formato válido para la validación OpenSpec.

**Non-Goals:**
- No introducir cambios de arquitectura ni refactorizaciones en este change.
- No cubrir funcionalidad futura que todavía no está en el código.

## Decisions

- **Base de datos**: PostgreSQL 16 (TypeORM `type: postgres` con driver `pg`), `synchronize: true` y TLS opcional via `DB_SSL=true`. Se levanta localmente con `docker-compose` (servicio `db`).
- **JWT sin refresh token**: token con expiración de 7 días en `localStorage`; interceptor de axios agrega `Authorization: Bearer <token>` y limpia las credenciales ante un 401.
- **Catálogo desde disco**: al iniciar, `SeedService` sincroniza jugadores y equipos reales desde la carpeta `Jugadores_Base_de_Datos` (cada `.json` es una plantilla/equipo), marcando los equipos como `isReal=true` y limpiando datos huérfanos.
- **Sesión de invitado**: un `sessionId` efímero (sessionStorage) permite jugar sin login; todos los datos (equipo, torneo, partidos) llevan `sessionId` y se limpian al cerrar la pestaña (beacon) o logout (`POST /draft/session/cleanup`).
- **Simulación de partido**: basada en la media del rating de los 11 titulares; los goles se distribuyen con Poisson (`±12 puntos de rating ≈ ±1 gol esperado`); en caso de empate se decide una tanda de penales ponderada por el rating.
- **Progresión del torneo**: el usuario juega su llave con `simulate-match` y luego `advanceTournament` simula/persiste las llaves IA pendientes y genera la siguiente ronda (OCTAVOS → CUARTOS → SEMIS → FINAL); al terminar la Final, el torneo pasa a `COMPLETED`.
- **Frontend orientado por pestañas**: Navbar de navegación (Inicio, Formación y Equipo, Historial y Cartas, Copa Élite) en lugar de "sin menú" de las primeras versiones.

## Risks / Trade-offs

- [postgres] → Necesita un contenedor PostgreSQL (docker-compose) o una instancia externa (Render).
- [synchronize: true] → Simplicidad para desarrollar, pero riesgo en producción (sin migraciones versionadas).
- [Token 7 días sin refresh] → Un token comprometido sigue válido una semana.
- [Catálogo desde disco] → Depende de que `Jugadores_Base_de_Datos` exista en el entorno; la falta de sincronización puede dejar catálogo vacío hasta que se restaure.
- [Simulación simple] → Basada en promedios de rating y Poisson; la estructura en DB permite evolucionar a una simulación más fina.