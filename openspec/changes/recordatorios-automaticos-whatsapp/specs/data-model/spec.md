## ADDED Requirements

### Requirement: Persistir configuración y estado de recordatorios
El esquema B2B MUST almacenar las anticipaciones por organización y un registro persistente por reserva y anticipación con una clave única que permita deduplicar el procesamiento.

#### Scenario: Crear esquema actualizado
- **WHEN** se aplica la migración B2B
- **THEN** las organizaciones existentes reciben los valores iniciales de 24 h y 1 h y queda disponible la tabla de entregas con su restricción única

#### Scenario: Revertir esquema actualizado
- **WHEN** se revierte la migración B2B
- **THEN** se eliminan la tabla y columna agregadas por esta migración
