## Context

El proyecto es una web donde el usuario explora jugadores de fútbol, arma un equipo mediante draft y se enfrenta a oponentes en un torneo de eliminación directa. La implementación actual usa un backend NestJS con SQLite para persistencia y un frontend React con Vite.

## Goals / Non-Goals

**Goals:**
- Arquitectura con backend NestJS + TypeORM + SQLite para persistencia real.
- Frontend moderno con React + Vite + Tailwind CSS + Zustand.
- Draft mode con apertura de sobres (pack opening) y selección de jugadores.
- Torneo de eliminación directa (octavos → cuartos → semis → final).
- Autenticación de usuarios con JWT (register/login).
- Base para que el producto pueda evolucionar con ranking y más modos de juego.

**Non-Goals:**
- No se implementará una liga completa ni manejo avanzado de estadísticas deportivas.
- No se integrarán APIs externas reales de fútbol en la primera versión.
- No se incluirán sistemas de pagos.

## Decisions

- **Frontend**: React + Vite + TypeScript + Tailwind CSS 4 + Zustand + Framer Motion.
- **Backend**: NestJS + TypeORM + better-sqlite3 para persistencia.
- **Auth**: JWT con Passport, contraseñas hasheadas con bcryptjs.
- **Data Model**: Entidades Player, Team, TeamPlayer (join table), Match, User.
- **Seeding**: 24 jugadores con stats realistas insertados al iniciar el servidor.
- **Simulación**: Basada en suma de stats de los 11 titulares vs oponente.
- **Torneo**: 16 equipos (1 usuario + 15 reales), bracket de eliminación directa.

## Risks / Trade-offs

- [better-sqlite3] → Módulo nativo requiere compilación en cada plataforma, pero es el driver recomendado por TypeORM.
- [Simulación simple] → La lógica actual es básica (stats promediados), pero la estructura en DB permite evolucionar a simulación más precisa.
- [Sin tests automatizados] → Riesgo de regresión al agregar funcionalidades.

## Migration Plan

- La primera etapa (actual) implementa backend completo con persistencia SQLite + API REST + auth JWT.
- El frontend tiene las pantallas base (login, dashboard, formation, draft-room, captain).
- Próxima etapa: conectar frontend con backend y crear pantallas de match-center y bracket.

## Open Questions

- ¿Se necesita un modo de juego más avanzado con puntuaciones y estadísticas por jugador?
- ¿Se agregará un sistema de ranking global entre usuarios?
