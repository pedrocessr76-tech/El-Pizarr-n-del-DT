## ADDED Requirements

### Requirement: Seed de jugadores
El sistema DEBE cargar 25 jugadores mock al iniciar el servidor con nombres, nacionalidades, posiciones y stats realistas.

#### Scenario: Seed automático
- **WHEN** el servidor NestJS inicia
- **THEN** la tabla `players` se puebla con 25 jugadores (Messi, Mbappé, Haaland, etc.)

### Requirement: Exploración del catálogo — PENDIENTE
El sistema DEBE proporcionar un endpoint GET /players para listar todos los jugadores disponibles con sus atributos.

#### Scenario: Explorar catálogo
- **WHEN** un usuario solicita la lista de jugadores
- **THEN** el sistema devuelve todos los jugadores con nombre, posición, nacionalidad y stats

### Requirement: Búsqueda de jugadores — PENDIENTE
El sistema DEBE permitir buscar jugadores por nombre o posición.

#### Scenario: Filtrar jugadores
- **WHEN** un usuario ingresa un término de búsqueda
- **THEN** el sistema devuelve solo los jugadores que coinciden
