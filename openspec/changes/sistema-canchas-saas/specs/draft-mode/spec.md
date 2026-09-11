## ADDED Requirements

### Requirement: Prototipo navegable
El primer incremento SHALL permitir recorrer las seis vistas de Stitch de Sistema Canchas con datos de ejemplo, separando los recorridos operativos de propietario/administrador/operador y cliente, sin exigir todavía una pasarela de pagos ni una operación completa de producción.

#### Scenario: Recorrido de demo
- **WHEN** un usuario abre la experiencia de demostración
- **THEN** puede recorrer login con perfil, dashboard operativo, disponibilidad, bandeja de reservas, portal cliente y confirmación de turno

#### Scenario: Cambio a producción
- **WHEN** una vista pasa de datos de ejemplo a API real
- **THEN** conserva sus contratos de presentación y reemplaza solo la fuente de datos

#### Scenario: Recorrido administrativo
- **WHEN** el usuario selecciona propietario, administrador u operador
- **THEN** accede al dashboard, disponibilidad y bandeja de reservas, con métricas y recaudación visibles según permisos

#### Scenario: Recorrido cliente
- **WHEN** el usuario selecciona cliente e inicia sesión
- **THEN** accede al portal de reserva, revisa precios y llega a la confirmación del turno sin reservar de forma anónima