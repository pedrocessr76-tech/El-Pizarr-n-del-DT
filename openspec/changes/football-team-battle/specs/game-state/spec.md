## REQUISITOS AGREGADOS

### Requisito: Vista de resumen del partido
El sistema DEBE presentar un resumen claro del último partido jugado.

#### Escenario: Mostrar resultado del partido
- **CUANDO** se completa un desafío de partido
- **ENTONCES** el sistema DEBE mostrar el resumen del resultado, las calificaciones de ambos equipos y el ganador

### Requisito: Retroalimentación del estado del equipo
El sistema DEBE informar al usuario si el equipo actual está listo para un partido.

#### Escenario: Retroalimentación de preparación del equipo
- **CUANDO** la alineación del usuario está incompleta o completa
- **ENTONCES** el sistema DEBE mostrar un mensaje de preparación apropiado
