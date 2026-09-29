## ADDED Requirements

### Requirement: Mostrar reloj del complejo en el dashboard
El dashboard operativo MUST mostrar hora y fecha actuales en la zona horaria de la organización y actualizar el reloj al menos una vez por segundo.

#### Scenario: Dashboard operativo abierto
- **WHEN** staff abre el dashboard
- **THEN** ve la fecha y hora local del complejo y la hora avanza en vivo

#### Scenario: Cambia la zona horaria cargada
- **WHEN** la aplicación resuelve o actualiza la zona horaria de la organización
- **THEN** el reloj muestra la hora correcta de esa zona
