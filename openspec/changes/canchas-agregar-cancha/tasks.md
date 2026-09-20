## 1. Backend

- [x] 1.1 Agregar en `apps/server/src/b2b/domain-policy.ts` la constante `B2B_COURT_SIZES` (FUTBOL 5/7/8/11) y la función `deriveCourtCapacity(sportType)` (10/14/16/22, default 10).
- [x] 1.2 En `createCourt` (`b2b-management.service.ts`): validar `sportType` contra `B2B_COURT_SIZES` (400 si es inválido), y derivar `capacity` con `deriveCourtCapacity` cuando no se envíe.
- [x] 1.3 En `updateCourt`: recalcular `capacity` con `deriveCourtCapacity` solo cuando el body no traiga `capacity`.
- [x] 1.4 Agregar/actualizar tests Jest del servicio de management: capacidad derivada por tamaño, capacidad explícita respetada, y `sportType` inválido → 400.

## 2. Frontend

- [x] 2.1 Reemplazar la barra inline de alta en `SettingsView` (tab `courts`) por un botón "＋ Agregar cancha" que despliegue un formulario dedicado (panel `settings-panel`) con: nombre, complejo destino (`<select>` sobre `facilities`), tamaño (`<select>` de Fútbol 5/7/8/11) y precio/hora ARS.
- [x] 2.2 Si la organización no tiene complejos, deshabilitar el alta con aviso ("Primero creá un complejo").
- [x] 2.3 `addCourt` debe enviar el `facilityId` elegido (no `facilities[0].id`) y limpiar el formulario tras crear.
- [x] 2.4 Mostrar en la lista "Canchas registradas" el complejo al que pertenece cada cancha (nombre del complejo además de tamaño/capacidad).

## 3. Verificación

- [x] 3.1 Ejecutar build del server y del client (`npm run build --workspace`)
- [x] 3.2 Correr tests Jest del backend.
- [x] 3.3 Actualizar/verificar el smoke test E2E local si corresponde (tamaño/tamaño inválido vía API).