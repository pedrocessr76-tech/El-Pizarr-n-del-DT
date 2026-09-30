## Why

El dashboard actual presenta los turnos como una agenda tabular, lo que dificulta reconocer rápidamente qué cancha está ocupada y en qué horarios. Una vista visual agrupada por complejo y cancha hará que la operación diaria sea más clara y agradable de recorrer.

## What Changes

- Reemplazar la agenda principal del dashboard por una vista visual de canchas agrupadas por complejo.
- Permitir elegir un complejo y mostrar solo sus canchas y turnos del día seleccionado.
- Mostrar por cancha si está ocupada y los horarios de los turnos pendientes o confirmados, conservando el detalle y la zona horaria de la organización.
- Mantener la navegación desde una cancha a la reserva asociada y conservar los filtros de fecha, métricas y acceso a crear reservas.

## Capabilities

### New Capabilities
- `dashboard-court-occupancy`: visualización del estado y los horarios diarios por cancha, agrupados por complejo.

### Modified Capabilities
- Ninguna.

## Impact

- Frontend B2B en `apps/client/src/pages/B2bApp.tsx` y estilos en `apps/client/src/index.css`.
- API existente `GET /api/v1/availability/week` y tipos de disponibilidad en `apps/client/src/services/b2bService.ts`; no se prevén cambios de API ni de esquema.
