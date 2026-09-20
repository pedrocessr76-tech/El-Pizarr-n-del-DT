## ADDED Requirements

### Requirement: Alta de cancha en un complejo con tamaño
El administrador SHALL poder agregar una cancha a un complejo de su organización mediante una opción dedicada de "Agregar cancha" que permita especificar el **nombre**, el **complejo destino**, el **tamaño** (Fútbol 5, Fútbol 7, Fútbol 8, Fútbol 11) y el **precio por hora** en ARS. La cancha creada SHALL quedar asociada al complejo elegido, no a un complejo implícito.

#### Scenario: Agregar cancha eligiendo complejo
- **WHEN** un administrador abre "Agregar cancha" y completa nombre, complejo destino, tamaño y precio
- **THEN** el sistema crea la cancha en el complejo seleccionado
- **AND** la cancha aparece en la lista "Canchas registradas" con su tamaño, capacidad y precio

#### Scenario: Sin complejos disponibles
- **WHEN** la organización no tiene complejos registrados
- **THEN** la opción de agregar cancha no permite continuar y se informa que primero debe crearse un complejo

### Requirement: Capacidad automática según tamaño
Cuando el administrador no indique una capacidad, el sistema SHALL derivarla según el tamaño de la cancha: Fútbol 5 → 10, Fútbol 7 → 14, Fútbol 8 → 16, Fútbol 11 → 22. Si el cliente envía una capacidad explícita, esa SHALL respetarse.

#### Scenario: Capacidad derivada del tamaño
- **WHEN** se crea una cancha de tamaño "Fútbol 7" sin indicar capacidad
- **THEN** la cancha queda con capacidad 14

#### Scenario: Capacidad explícita respetada
- **WHEN** se crea una cancha indicando una capacidad manual
- **THEN** el sistema conserva la capacidad indicada en lugar de derivarla

### Requirement: Validación del tamaño en la API
`POST /api/v1/facilities/:facilityId/courts` SHALL rechazar con `400` cualquier `sportType` que no esté entre los tamaños admitidos (FUTBOL 5, FUTBOL 7, FUTBOL 8, FUTBOL 11). La lista de tamaños admitidos SHALL estar centralizada para reutilizarse entre backend y frontend.

#### Scenario: Tamaño inválido rechazado
- **WHEN** se envía `sportType` con un valor no admitido (ej. "FUTBOL 9")
- **THEN** la API responde `400` y no crea la cancha

#### Scenario: Tamaño admitido aceptado
- **WHEN** se envía `sportType` como uno de los tamaños admitidos
- **THEN** la API crea la cancha con ese tamaño