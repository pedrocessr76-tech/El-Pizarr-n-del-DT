## ADDED Requirements

### Requirement: Armado del equipo en mobile
En `< md`, el armado MUST conservar la cancha vertical y la validación de plantilla (11 titulares + 7 suplentes) y capitán, y MUST adaptar la interacción: cancha escalada al ancho del teléfono, banca de 7 suplentes como franja horizontal deslizable, dificultad como control segmentado y barra **Continuar** fija sobre el bottom nav. El modal de preparación de partido MUST presentarse como bottom sheet.

#### Scenario: Reorganizar la cancha en mobile
- **WHEN** el usuario cambia de formación en mobile
- **THEN** la cancha vertical se reorganiza con los slots de la formación elegida, conservando los jugadores ya asignados cuando se puede.

#### Scenario: Gestionar la banca
- **WHEN** el usuario ve la banca de suplentes en mobile
- **THEN** puede desplazarla horizontalmente y asignar suplentes como en el layout actual.

#### Scenario: Validación de plantilla en mobile
- **WHEN** faltan jugadores por asignar en mobile
- **THEN** el sistema muestra cuántos faltan y no habilita el avance hasta completar 11 + 7.
