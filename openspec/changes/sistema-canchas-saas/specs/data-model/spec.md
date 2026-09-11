## ADDED Requirements

### Requirement: Modelo multi-tenant
El sistema SHALL persistir organizaciones, usuarios, roles, complejos, canchas, reglas de disponibilidad, turnos, bloqueos y reservas en una base de datos B2B independiente de la base del juego, con relaciones que permitan aislar datos por organización.

#### Scenario: Consulta aislada
- **WHEN** una consulta se ejecuta con una organización activa
- **THEN** solo devuelve registros pertenecientes a esa organización

#### Scenario: Organización nueva
- **WHEN** se registra un propietario
- **THEN** el sistema crea un espacio organizacional aislado con configuración `ARS` y `America/Argentina/Buenos_Aires`

### Requirement: Integridad de reservas
El modelo SHALL impedir reservas activas solapadas para la misma cancha y turno, y SHALL asociar cada reserva a un usuario autenticado.

#### Scenario: Restricción de solapamiento
- **WHEN** una nueva reserva activa se solapa con otra de la misma cancha
- **THEN** la transacción falla y conserva la reserva original

#### Scenario: Reserva sin usuario
- **WHEN** se intenta persistir una reserva sin `client_user_id` o actor interno válido
- **THEN** la transacción falla por integridad y no se guarda la reserva