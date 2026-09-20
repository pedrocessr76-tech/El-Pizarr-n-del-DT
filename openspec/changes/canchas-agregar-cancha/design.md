## Context

La gestión de canchas del complejo vive en `SettingsView` de `apps/client/src/pages/B2bApp.tsx` (tab `courts`). Hoy el alta es una barra inline (nombre, precio, tamaño) que llama a `POST /api/v1/facilities/:facilityId/courts` usando **siempre `facilities[0].id`**, sin poder elegir el complejo destino. El backend (`createCourt` en `b2b-management.service.ts`) acepta `sportType` libre, no valida los tamaños, y fija `capacity` en 10 cuando no se envía. `CourtDto` es una clase local del controller sin `class-validator`.

## Goals / Non-Goals

**Goals:**
- Formulario dedicado y visible de "Agregar cancha" con: nombre, complejo destino, tamaño (Fútbol 5/7/8/11) y precio/hora (ARS).
- Capacidad automática derivada del tamaño en el backend cuando no se indique.
- Validación server-side del tamaño contra los admitidos (400 si es inválido).
- Sin cambios de esquema de BD (se reutilizan `sportType`, `capacity`).

**Non-Goals:**
- Nuevas especificaciones (superficie, techado, iluminación, dimensiones): descartadas por decisión del usuario para esta iteración.
- Edición completa de cancha (se conserva la edición de precio existente).
- Generación de turnos/horarios (ya cubierta por la pestaña "Horarios").

## Decisions

- **Selector de complejo en el formulario:** se agrega un `<select>` con los complejos del admin (`facilities`). Si no hay complejos, el botón "Agregar cancha" queda deshabilitado con un aviso. Alternativa (crear en `facilities[0]`) descartada porque oculta datos y crea canchas en el complejo equivocado.
- **Tamaños admitidos centralizados en `domain-policy.ts`:** constante `B2B_COURT_SIZES = ['FUTBOL 5','FUTBOL 7','FUTBOL 8','FUTBOL 11']` y función `deriveCourtCapacity(sportType)` (`F5→10`, `F7→14`, `F8→16`, `F11→22`, default 10). Reutilizable entre controller/servicio/tests. Alternativa (mover el enum a la entidad) descartada para no acoplar la validación de input al esquema.
- **Validación en servicio (no DTO con class-validator):** `createCourt` lanza `BadRequestException` si `sportType` presente no está en los admitidos. `createCourt` y `updateCourt` recalcular `capacity` derivado solo si el cliente no envía `capacity`. Alternativa (obligar al cliente a enviar capacidad) descartada: la capacidad es una consecuencia del tamaño y no debería depender del formulario.
- **Interfaz del form:** botón "＋ Agregar cancha" que despliega el panel (mismo patrón de panel `settings-panel` ya usado), no un modal. Mantiene el estilo actual e insumos simples (`b2b-input`). Alternativa (modal) descartada por simplicidad.

## Risks / Trade-offs

- [Capacidad derivada puede pisar una capacidad manual previa en `updateCourt`] → Solo se recalcula cuando `capacity` no viene en el body; si viene, se respeta.
- [El form queda en `SettingsView`, ofuscado en una página grande] → Viene precedido por el tab "Canchas registradas" y el título del panel lo describe; la selección de complejo hace explícito el destino.
- [Validación solo de tamaño, `sportType` sique almacenado como string] → Los valores admitidos quedan centralizados y se reutilizan en frontend (lista) si se desea futuro tipado.