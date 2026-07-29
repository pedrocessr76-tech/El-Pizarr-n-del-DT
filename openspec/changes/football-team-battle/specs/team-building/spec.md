## REQUISITOS AGREGADOS

### Requisito: Composición del equipo
El sistema DEBE permitir a los usuarios componer una plantilla con un total de 18 jugadores (11 titulares y 7 suplentes).

#### Escenario: Agregar jugador a la alineación
- **CUANDO** un usuario selecciona un jugador del catálogo
- **ENTONCES** el sistema DEBE incluir a ese jugador en la plantilla del equipo actual

### Requisito: Eliminar jugador de la alineación
El sistema DEBE permitir a los usuarios eliminar jugadores del equipo seleccionado antes de un partido.

#### Escenario: Eliminar jugador de la alineación
- **CUANDO** un usuario elimina un jugador de la plantilla
- **ENTONCES** el sistema DEBE actualizar la alineación mostrada de inmediato

### Requisito: Validación de tamaño del equipo
El sistema DEBE limitar la plantilla a un máximo de 18 jugadores.

#### Escenario: Limitar tamaño
- **CUANDO** el usuario intenta agregar un jugador y la plantilla ya tiene 18
- **ENTONCES** el sistema DEBE impedir la acción y mostrar un aviso.
