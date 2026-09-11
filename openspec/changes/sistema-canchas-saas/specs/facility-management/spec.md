## ADDED Requirements

### Requirement: Gestión de complejos y canchas
El sistema SHALL permitir que un usuario con rol autorizado cree y administre complejos deportivos y sus canchas dentro de su organización.

#### Scenario: Crear una cancha
- **WHEN** un administrador envía nombre, tipo, capacidad y complejo válido
- **THEN** el sistema crea la cancha activa asociada a su organización

#### Scenario: Acceso entre organizaciones
- **WHEN** un usuario intenta consultar o modificar una cancha de otra organización
- **THEN** el sistema rechaza la operación con una respuesta de autorización

### Requirement: Configuración operativa
El sistema SHALL permitir configurar horarios semanales, precio base en ARS y bloqueos manuales por cancha. Toda organización SHALL usar `America/Argentina/Buenos_Aires` como zona horaria inicial.

#### Scenario: Bloquear un horario
- **WHEN** un operador registra un bloqueo dentro del horario de una cancha
- **THEN** el sistema impide nuevas reservas que se solapen con ese bloqueo

#### Scenario: Valores regionales iniciales
- **WHEN** se crea una organización nueva
- **THEN** queda configurada con moneda `ARS` y zona horaria `America/Argentina/Buenos_Aires`