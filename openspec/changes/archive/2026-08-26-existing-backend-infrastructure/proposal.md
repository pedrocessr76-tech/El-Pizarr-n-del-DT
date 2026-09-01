## Why

El Pizarrón del DT es un juego de gestión futbolística: el jugador explora un catálogo de jugadores reales, arma un equipo en una formación, y compite en un torneo de eliminación directa contra equipos reales (IA). Este change documenta y refleja el **estado ACTUAL** del proyecto tal como está implementado hoy, después de la evolución del backend, frontend, simulación y la migración de la base de datos. También corrige el formato de las specs para que cumplan la estructura OpenSpec (`## Purpose`, `## Requirements`, `### Requirement` con `SHALL`/`MUST` y `#### Scenario:`), ya que versiones anteriores mezclaban encabezados en español y no validaban.

## What Changes

- Reflejar el **stack real actual**: back-end NestJS + TypeORM + **PostgreSQL** (antes SQLite embebida) y frontend React + Vite + Tailwind + Zustand + axios.
- Documentar los endpoints reales del backend (auth, players, draft, match), incluidas las sesiones de invitado y la limpieza al cerrar pestaña.
- Documentar el catálogo sincronizado desde la carpeta `Jugadores_Base_de_Datos` (equipos reales, `isReal`).
- Documentar el frontend implementado: Home, Formación/Equipo con cancha y banca, Catálogo/Historial, Torneo/bracket y partido en vivo.
- Unificar la línea base eliminando el change duplicado `football-team-battle` (misma cobertura, en español e inválido) y quedando un solo change canónico.

## Capabilities

### New Capabilities
- `data-model`: Entidades Player, Team, TeamPlayer, Match, **Tournament** y User con TypeORM + PostgreSQL.
- `user-auth`: Registro, login con JWT (7 días) y perfil protegido; login/registro en overlay desde el frontend.
- `player-catalog`: Catálogo de jugadores sincronizado desde disco (equipos reales) y endpoint `GET /players`.
- `draft-mode`: Apertura de sobre (5 jugadores, con compatibilidad de posiciones FIFA), selección, equipo y sesión de invitado.
- `team-building`: CRUD de equipos con validación de plantilla **11 titulares + 7 suplentes (18)**.
- `match-generation`: Torneo de 16 equipos (Octavos → Cuartos → Semis → Final), simulación ponderada por rating, penales y progresión de llaves.
- `game-state`: Historial de torneos por usuario, resumen del partido, retroalimentación de preparación del equipo y torneo completo/finalizado.

### Modified Capabilities
- Ninguna — primera versión consolidada.

## Impact

- **Backend**: NestJS + TypeORM + PostgreSQL en el puerto 3001, con Swagger en `/docs`.
- **Frontend**: React + Vite + Tailwind + Zustand + axios, con Navbar de pestañas (Inicio, Formación y Equipo, Historial y Cartas, Copa Élite).
- **Datos**: catálogo y equipos reales sincronizados desde `Jugadores_Base_de_Datos` al iniciar el servidor.
- **Sesiones**: soporte de invitado (guest) con datos efímeros por `sessionId` que se limpian al cerrar la pestaña/sesión.
- **Persistencia**: PostgreSQL local (docker-compose) o PostgreSQL de Render en producción, con `synchronize: true` en desarrollo.