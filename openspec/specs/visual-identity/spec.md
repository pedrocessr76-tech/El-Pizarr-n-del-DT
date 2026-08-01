## ADDED Requirements

### Requirement: Tema visual simple y futbolístico
El sistema DEBE usar un tema visual simple, relacionado al fútbol, que no moleste a la vista. Colores en tonos verdes (campo), blancos y grises. Sin animaciones excesivas ni elementos distractivos.

#### Scenario: Fondo de pantalla
- **WHEN** cualquier pantalla se renderiza
- **THEN** el fondo usa tonos verdes suaves y detalles minimalistas de fútbol (líneas de cancha, texturas sutiles)

#### Scenario: Colores sobrios
- **WHEN** los elementos de UI se muestran
- **THEN** usan colores verdes, blancos, grises y detalles dorados/plateados según el nivel de carta

### Requirement: Tipografía clara
El sistema DEBE usar una tipografía limpia y legible para nombres, stats y ratings.

#### Scenario: Lectura en cartas
- **WHEN** una carta se renderiza
- **THEN** el rating general es el elemento más grande y visible; las stats secundarias usan texto más pequeño pero legible
