## REQUISITOS AGREGADOS

### Requisito: Exploración del catálogo de jugadores
El sistema DEBE proporcionar un catálogo de jugadores de fútbol con información básica como nombre, posición, nacionalidad y calificación general.

#### Escenario: Explorar catálogo
- **CUANDO** un usuario abre el catálogo de jugadores
- **ENTONCES** el sistema DEBE mostrar la lista de jugadores disponibles con sus atributos principales

### Requisito: Búsqueda de jugadores por atributo
El sistema DEBE permitir a los usuarios buscar jugadores por nombre o posición.

#### Escenario: Filtrar jugadores
- **CUANDO** un usuario ingresa un término de búsqueda
- **ENTONCES** el sistema DEBE mostrar solo los jugadores que coincidan con el criterio de búsqueda

## REQUISITOS AGREGADOS

### Requisito: Construcción del equipo
El sistema DEBE permitir a los usuarios crear un equipo seleccionando jugadores del catálogo.

#### Escenario: Seleccionar jugadores para el equipo
- **CUANDO** un usuario elige un jugador del catálogo
- **ENTONCES** el sistema DEBE agregar ese jugador a la alineación actual del equipo

### Requisito: Validación de la alineación del equipo
El sistema DEBE evitar agregar más jugadores de los permitidos por el tamaño de equipo configurado.

#### Escenario: Limitar el tamaño del equipo
- **CUANDO** un usuario intenta agregar un jugador después de que la alineación está llena
- **ENTONCES** el sistema DEBE bloquear la adición y mostrar un mensaje claro

## REQUISITOS AGREGADOS

### Requisito: Generación de partido
El sistema DEBE generar un equipo oponente aleatorio para cada desafío de partido.

#### Escenario: Crear oponente aleatorio
- **CUANDO** un usuario inicia un desafío de partido
- **ENTONCES** el sistema DEBE generar un equipo oponente usando jugadores disponibles

### Requisito: Mostrar resultado del partido
El sistema DEBE mostrar un resumen simple del resultado del partido una vez que se juegue.

#### Escenario: Mostrar resultado del partido
- **CUANDO** un desafío de partido finaliza
- **ENTONCES** el sistema DEBE mostrar el resumen del resultado y el desempeño del equipo
