## Why

El administrador necesita una opción clara de **Agregar cancha** dentro de la gestión de sus canchas, donde pueda especificar el tamaño (Fútbol 5/7/8/11) y las especificaciones de la cancha. Hoy el formulario existe pero es una barra inline que crea la cancha siempre en el primer complejo, sin selección de complejo destino, con capacidad fija y sin validación del tamaño.

## What Changes

- Frontend: nuevo botón **＋ Agregar cancha** en el sector "Canchas registradas" que abre un formulario dedicado con: **nombre**, **complejo destino** (selector, en lugar de fijarlo a `facilities[0]`), **tamaño** (Fútbol 5/7/8/11) y **precio por hora (ARS)**.
- Backend: derivar la **capacidad automática** según el tamaño cuando no se indique (`FÚTBOL 5` → 10, `FÚTBOL 7` → 14, `FÚTBOL 8` → 16, `FÚTBOL 11` → 22; por defecto 10).
- Backend: validar `sportType` contra los tamaños admitidos en `POST /api/v1/facilities/:facilityId/courts` (rechazar valores desconocidos con 400).
- Mantener: la cancha se lista en "Canchas registradas" con tamaño, capacidad y precio; edición de precio ya existente.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `saas-access`: el alta de canchas dentro de un complejo pasa a ser un formulario dedicado con selección de complejo, tamaño obligatorio y capacidad automática; el tamaño se valida en la API.

## Impact

- `apps/client/src/pages/B2bApp.tsx` (`SettingsView`): formulario de "Agregar cancha" con selector de complejo, tamaño y precio.
- `apps/server/src/b2b/b2b-management.controller.ts` (`CourtDto`): validación de `sportType`.
- `apps/server/src/b2b/b2b-management.service.ts` (`createCourt`): capacidad automática según tamaño y validación de tamaño.
- `apps/server/src/b2b/domain-policy.ts`: constantes de tamaños admitidos y capacidad derivada (reutilizable).
- Tests de backend (Jest) y script `apps/server/scripts/b2b-smoke-test.mjs` si corresponde.