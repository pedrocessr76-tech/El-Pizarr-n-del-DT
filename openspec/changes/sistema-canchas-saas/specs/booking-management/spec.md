## ADDED Requirements

### Requirement: Consultar disponibilidad
El sistema SHALL devolver los turnos disponibles de una cancha para un rango de fechas considerando horarios, bloqueos y reservas activas. Los turnos SHALL tener una duración configurable de exactamente 1 o 2 horas en el MVP.

#### Scenario: Turno ocupado
- **WHEN** existe una reserva confirmada que se solapa con un turno solicitado
- **THEN** ese turno no aparece como disponible

#### Scenario: Rango sin disponibilidad
- **WHEN** el rango consultado no tiene turnos libres
- **THEN** el sistema devuelve una lista vacía sin crear reservas

#### Scenario: Duración inválida
- **WHEN** un usuario intenta configurar o reservar un bloque distinto de 1 o 2 horas
- **THEN** el sistema rechaza la operación por validación

### Requirement: Crear y confirmar reservas
El sistema SHALL permitir crear una reserva únicamente a un cliente autenticado o a un rol interno autenticado, y controlar su transición entre `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` y `NO_SHOW`.

#### Scenario: Reserva válida
- **WHEN** un usuario solicita un turno libre con datos de contacto válidos
- **THEN** el sistema crea una reserva `PENDING` y devuelve su identificador

#### Scenario: Doble reserva
- **WHEN** dos solicitudes intentan confirmar el mismo turno de forma concurrente
- **THEN** solo una se confirma y la otra recibe un conflicto sin doble asignación

#### Scenario: Cliente sin cuenta
- **WHEN** una persona intenta reservar sin cuenta autenticada
- **THEN** el sistema rechaza la reserva y solicita iniciar sesión o registrarse

### Requirement: Cancelar o reprogramar
El sistema SHALL permitir cancelar o reprogramar una reserva según las reglas configuradas por el complejo y registrar quién realizó la acción.

#### Scenario: Cancelación autorizada
- **WHEN** el cliente u operador cancela dentro de la ventana permitida
- **THEN** la reserva pasa a `CANCELLED` y el turno vuelve a estar disponible