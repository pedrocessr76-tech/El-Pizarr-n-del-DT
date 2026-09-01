# visual-identity

## Purpose

Define la identidad visual del juego: tema de color oscuro con acentos futbolísticos, tipografía clara y detalles de materiales, manteniendo una estética simple, sobria y no distractiva.

## Requirements

### Requirement: Tema futbolístico y sobrio
El sistema MUST usar un tema oscuro con tonos azulados/verdes de campo y acentos verdes, sobre fondos con bordes sutiles y efectos "glass"; sin animaciones excesivas ni elementos distractivos.

#### Scenario: Fondo de pantalla
- **WHEN** cualquier pantalla se renderiza
- **THEN** el fondo usa tonos oscuros con toques verdes de campo y detalles minimalistas de fútbol.
#### Scenario: Colores sobrios
- **WHEN** los elementos de UI se muestran
- **THEN** usan verdes, blancos, grises y dorados/plateados según el nivel de la carta.

### Requirement: Tipografía clara
El sistema MUST usar una tipografía limpia y legible para nombres, stats y ratings, con el rating general como el elemento más grande y visible dentro de cada carta.

#### Scenario: Lectura en las cartas
- **WHEN** una carta se renderiza
- **THEN** el rating general es el elemento más grande y las stats secundarias usan texto más pequeño pero legible.