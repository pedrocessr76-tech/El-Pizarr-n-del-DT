## ADDED Requirements

### Requirement: Composición responsive y mobile
El sistema MUST adaptar su identidad visual a viewports `< md` manteniendo el tema sobrio actual: barras de navegación fijas con `backdrop-blur`, respeto de `safe-area-inset` superior e inferior, contenido no tapado por las barras, controles de al menos 44px y predominio de acciones primarias en la zona de alcance del pulgar. El sistema MUST NOT introducir animaciones distractivas ni cambiar la paleta base de cada superficie.

#### Scenario: Layout mobile con barras fijas
- **WHEN** una pantalla se renderiza en `< md`
- **THEN** usa barras fijas con desenfoque y deja libre el contenido por debajo de la barra inferior.

#### Scenario: Safe areas
- **WHEN** la app se abre en un dispositivo con notch o barra de gestos
- **THEN** el header y el bottom nav respetan los insets para no quedar tapados.

#### Scenario: Taps accesibles
- **WHEN** se renderizan controles interactivos en mobile
- **THEN** su área táctil es de al menos 44px y mantienen el aspecto sobrio de la identidad.
