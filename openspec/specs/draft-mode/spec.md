## ADDED Requirements

### Requirement: Apertura de sobre (Pack Opening)
El sistema DEBE retornar 5 jugadores aleatorios del catálogo global vía GET /draft/pack. Visualmente se muestra una animación de sobre abriéndose y luego se revelan las 5 cartas.

#### Scenario: Obtener sobre
- **WHEN** el usuario presiona "Abrir sobre"
- **THEN** el sistema retorna 5 jugadores aleatorios y los muestra como cartas

### Requirement: Diseño de carta estilo FIFA Ultimate Team
Cada carta DEBE tener el estilo visual de FIFA Ultimate Team. La carta es rectangular vertical con bordes redondeados. El fondo es un DEGRADADO DINÁMICO con patrón de cheurones, rombos o rayas diagonales en tonos del nivel correspondiente. La SILUETA es una figura humana reconocible de futbolista en pose de acción (perfil de jugador pateando, corriendo o saltando, con torso, brazos y piernas definidos, sin rostro). La silueta OCUPA LA MITAD SUPERIOR de la carta y termina justo arriba de la sección de stats. Arriba izquierda: bandera de nacionalidad. Arriba derecha: posición (GK/DEF/MID/FWD) dentro de un badge. Debajo de la silueta (en la mitad inferior): nombre del jugador en texto blanco bold. Abajo del nombre: rating general en número grande (ej. "85") con glow del color del nivel. En la parte inferior: 6 stats en grilla 2x3 (RIT, TIR, PAS arriba | REG, DEF, FIS abajo), cada una con barra coloreada según el valor (verde >75, amarillo 60-75, rojo <60). La carta ES LA MISMA en el catálogo, en el overlay de selección y en cualquier lugar donde se muestre un jugador.

#### Scenario: Visualizar carta FIFA-style con silueta humana
- **WHEN** una carta de jugador se renderiza
- **THEN** muestra: fondo degradado con patrón, silueta de futbolista (figura humana reconocible con brazos y piernas) ocupando la mitad superior, bandera arriba izquierda, badge de posición arriba derecha, nombre blanco bold, rating grande con glow, y 6 stats en grilla 2x3 con barras coloreadas abajo del todo. La misma carta aparece en catálogo, overlays y cancha.

### Requirement: Niveles de carta por rating (Bronce/Plata/Oro)
El sistema DEBE clasificar las cartas en 3 niveles según el rating general, cada uno con su propio color de fondo degradado, patrón y estilo: Bronce (<60), Plata (60-80), Oro (>80).

#### Scenario: Carta Bronce
- **WHEN** un jugador tiene rating menor a 60
- **THEN** la carta se muestra con fondo degradado marrón/ámbar, patrón cheurones bronce, glow ámbar en el rating

#### Scenario: Carta Plata
- **WHEN** un jugador tiene rating entre 60 y 80
- **THEN** la carta se muestra con fondo degradado gris/azul plateado, patrón rombos plata, glow plateado en el rating

#### Scenario: Carta Oro
- **WHEN** un jugador tiene rating mayor a 80
- **THEN** la carta se muestra con fondo degradado dorado/naranja brillante, patrón rayas diagonales oro, glow dorado en el rating

### Requirement: Selección de jugador del sobre
El sistema DEBE permitir seleccionar UN jugador de los 5 mostrados para agregarlo al equipo. Los otros 4 se descartan.

#### Scenario: Seleccionar jugador
- **WHEN** el usuario toca una carta del sobre
- **THEN** el sistema verifica que el jugador existe en la DB, lo agrega al equipo, y los otros 4 se descartan

### Requirement: Repetir apertura hasta completar plantilla
El sistema DEBE permitir abrir sobres repetidamente hasta que el equipo tenga 11 titulares y 7 suplentes (18 jugadores).

#### Scenario: Abrir múltiples sobres
- **WHEN** el equipo tiene menos de 18 jugadores
- **THEN** el sistema permite abrir otro sobre

#### Scenario: Plantilla completa
- **WHEN** el equipo llega a 18 jugadores
- **THEN** el sistema bloquea la apertura de más sobres y muestra botón para continuar

### Requirement: Validación de equipo completo
El sistema DEBE impedir seleccionar jugadores si el equipo ya tiene 11 titulares para esa posición.

#### Scenario: Evitar exceder
- **WHEN** la posición correspondiente ya tiene un titular asignado
- **THEN** el sistema bloquea la selección y muestra un mensaje
