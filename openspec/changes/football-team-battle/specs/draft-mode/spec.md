## REQUISITOS AGREGADOS

### Requisito: Mecánica de apertura de sobre (Pack Opening)
El sistema DEBE permitir a los usuarios abrir un sobre conteniendo un conjunto aleatorio de jugadores del catálogo global para iniciar o continuar la selección del equipo.

#### Escenario: Obtener sobre de jugadores
- **CUANDO** el usuario solicita abrir un sobre
- **ENTONCES** el sistema DEBE retornar una selección aleatoria de exactamente 5 jugadores del catálogo

### Requisito: Selección de jugador de sobre (Draft Selection)
El sistema DEBE permitir al usuario seleccionar exactamente un jugador del sobre abierto para añadirlo a su alineación de 11 jugadores.

#### Escenario: Seleccionar un jugador para el equipo
- **CUANDO** el usuario elige un jugador del sobre
- **ENTONCES** el sistema DEBE registrar la elección, añadir al jugador al equipo y vaciar el sobre actual para obligar a abrir otro sobre para la siguiente selección

### Requisito: Validación de duplicados y tamaño en la selección
El sistema DEBE evitar añadir jugadores si el equipo ya está lleno (11 jugadores).

#### Escenario: Evitar exceder tamaño de plantilla
- **CUANDO** el equipo ya contiene 11 jugadores
- **ENTONCES** el sistema DEBE impedir la adición de nuevos jugadores y mostrar un mensaje apropiado
