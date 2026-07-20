## REQUISITOS AGREGADOS

### Requisito: Generación aleatoria de oponente
El sistema DEBE generar un equipo oponente con jugadores seleccionados del catálogo disponible.

#### Escenario: Crear equipo oponente
- **CUANDO** un usuario inicia un desafío de partido
- **ENTONCES** el sistema DEBE construir una alineación aleatoria del oponente usando los jugadores disponibles

### Requisito: Comparación de puntuación del partido
El sistema DEBE comparar la calificación general del equipo del usuario y del equipo oponente.

#### Escenario: Comparar equipos
- **CUANDO** se resuelve un partido
- **ENTONCES** el sistema DEBE calcular la calificación relativa y declarar un ganador o un empate
