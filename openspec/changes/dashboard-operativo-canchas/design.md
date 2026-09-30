## Context

El dashboard staff de `B2bApp.tsx` ya carga complejos, canchas, reservas y métricas, pero presenta la actividad del día como una tabla de agenda. La API `GET /api/v1/availability/week` ya devuelve todos los turnos de cada cancha junto con su estado (`AVAILABLE`, `PENDING`, `CONFIRMED`, `BLOCKED`) y la relación con el complejo, por lo que no hace falta cambiar el backend.

## Goals / Non-Goals

**Goals:**
- Hacer que la lectura principal del dashboard sea visual y centrada en las canchas.
- Elegir complejo y fecha; mostrar únicamente sus canchas con los turnos del día.
- Mostrar ocupación y franjas ocupadas de forma clara, manteniendo acceso a la reserva asociada.

**Non-Goals:**
- Cambiar el esquema de datos, los endpoints, el proceso de reserva o el panel de métricas.
- Crear una vista de plano físico configurable o modificar la disponibilidad semanal existente.

## Decisions

- Consultar la disponibilidad semanal existente al elegir fecha (rango de medianoche local a la siguiente medianoche) y usar `facilityId` para agrupar; esto evita duplicar reglas de estados en el cliente.
- Presentar complejos como selectores claros y una cuadrícula responsive de tarjetas por cancha. Cada tarjeta resume estado/ocupación y lista las franjas ocupadas con hora y cliente cuando esté disponible.
- Tratar `PENDING` y `CONFIRMED` como ocupadas, `BLOCKED` como bloqueadas y `AVAILABLE` como libres. Al seleccionar una franja reservada se abre el mismo detalle de reserva que usa la agenda actual.
- Mantener el selector de fecha, las métricas existentes y su filtro por cancha al seleccionar una tarjeta.

## Risks / Trade-offs

- **Una consulta de disponibilidad semanal completa por fecha puede traer más datos de los necesarios** → Reutilizar el endpoint actual, que ya entrega el conjunto por organización, y refrescar únicamente al cambiar la fecha.
- **Un complejo sin canchas o turnos podría parecer vacío** → Mostrar estados vacíos específicos con acceso a administrar canchas o disponibilidad.
- **La API informa reservas por turno, no ocupación física instantánea** → Rotular el resumen como ocupación del día y derivarlo solo de estados de turno.
