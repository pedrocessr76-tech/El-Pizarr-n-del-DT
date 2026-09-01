## ADDED Requirements

### Requirement: Sincronización del catálogo en el arranque
El sistema MUST sincronizar su catálogo al iniciar el servidor leyendo los archivos `.json` de la carpeta `Jugadores_Base_de_Datos`; cada archivo representa una plantilla/equipo real y crea/actualiza jugadores y equipos marcados (`isReal=true`), limpiando los datos huérfanos.

#### Scenario: Iniciar el servidor con la carpeta de datos
- **WHEN** el backend arranca y encuentra la carpeta `Jugadores_Base_de_Datos`
- **THEN** se crean/actualizan jugadores y equipos reales, y se eliminan los jugadores que ya no existen ni pertenecen a ningún equipo.

### Requirement: Listado del catálogo
El sistema MUST exponer `GET /players` que devuelva todos los jugadores con nombre, posición, nacionalidad, `rating` y stats, ordenados por rating general descendente.

#### Scenario: Consultar el catálogo
- **WHEN** el frontend solicita `GET /players`
- **THEN** el sistema devuelve el catálogo completo ordenado por rating.

### Requirement: Filtros y búsqueda en el catálogo
La grilla del catálogo MUST permitir filtrar por posición (GK/DEF/MID/FWD o posiciones presentes), por rareza (Oro/Plata/Bronce) y por rating mínimo, además de buscar por nombre; el filtrado se aplica en el cliente sobre la lista completa.

#### Scenario: Filtrar y buscar cartas
- **WHEN** el usuario digita un nombre o selecciona una posición/rareza/rating
- **THEN** la grilla muestra solo los jugadores que coinciden con todos los criterios.