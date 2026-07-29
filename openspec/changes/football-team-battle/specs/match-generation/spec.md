## REQUISITOS AGREGADOS

### Requisito: Estructura de Torneo (Eliminatorias)
El sistema DEBE organizar los partidos en un formato de torneo de eliminación directa, comenzando desde octavos de final hasta la gran final.

#### Escenario: Progresión en el torneo
- **DADO** que el usuario tiene un equipo completo de 11 jugadores
- **CUANDO** inicia el modo torneo
- **ENTONCES** el sistema DEBE generar un cuadro de eliminatorias (bracket) con 16 equipos (incluyendo al usuario).
- **Y** el usuario DEBE ganar el partido actual para avanzar a la siguiente ronda (Octavos -> Cuartos -> Semis -> Final).

### Requisito: Oponentes de Equipos Reales
El sistema DEBE utilizar nombres y perfiles de equipos de la vida real para los oponentes del torneo.

#### Escenario: Generar equipos reales
- **CUANDO** se genera el cuadro del torneo
- **ENTONCES** el sistema DEBE seleccionar oponentes de una lista de equipos reales (ej. Real Madrid, Barcelona, Liverpool, Manchester City, Bayern Munich, etc.).

### Requisito: Dificultad Dinámica por Media del Equipo
La dificultad de cada enfrentamiento DEBE estar determinada por la calificación media (rating) del equipo oponente.

#### Escenario: Escalamiento de dificultad
- **CUANDO** se simula un partido contra un equipo real
- **ENTONCES** el sistema DEBE calcular la probabilidad de victoria basada en la diferencia de medias entre el equipo del usuario y el oponente real.
- **Y** los equipos en rondas más avanzadas DEBEN tender a tener medias más altas.

### Requisito: Comparación de puntuación del partido
El sistema DEBE comparar la calificación general del equipo del usuario y del equipo oponente real para determinar el resultado.

#### Escenario: Simular resultado de eliminatoria
- **CUANDO** se resuelve un partido del torneo
- **ENTONCES** el sistema DEBE calcular el marcador basándose en las estadísticas y declarar un ganador.
- **Y** en caso de empate, el sistema DEBE resolver el ganador (ej. por penales) para asegurar que alguien avance.
