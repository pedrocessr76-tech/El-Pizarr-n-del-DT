# team-building

## Purpose

Define el armado del equipo: elección de formación, cancha vertical con slots por posición, banca de suplentes, capitán y la validación de plantilla (11 titulares + 7 suplentes = 18).

## Requirements

### Requirement: Selección de alineación
El sistema MUST permitir elegir entre múltiples formaciones disponibles (p. ej. 4-3-3 Plana/Falso 9/Defensiva/Ofensiva, 4-4-2 Plana/Diamante, 4-2-3-1, 3-4-3, 5-3-2, 5-4-1, 4-1-4-1, 3-5-2, etc.). Cada formación define los slots titulares (POR/defensas/medios/delanteros) según el sistema de posiciones FIFA y 7 slots de suplentes.

#### Scenario: Cambiar de formación
- **WHEN** el usuario selecciona una formación
- **THEN** la cancha se reorganiza con los slots de la formación elegida conservando a los jugadores ya asignados cuando es posible.

### Requirement: Cancha vertical sin scroll + banca
El sistema MUST mostrar la cancha en orientación vertical con slots para cada posición titular distribuidos por zona, y la banca de 7 suplentes (en la columna derecha). El layout incluye la selección de formación y las acciones de armado.

#### Scenario: Ver la cancha y la banca
- **WHEN** el usuario llega a "Formación y Equipo"
- **THEN** se muestran los slots titulares por zona (arquero, defensa, medios, ataque) y una banca de 7 suplentes.

### Requirement: Compatibilidad de posiciones
El sistema MUST ofrecer solo jugadores compatibles con cada slot: un mapa de compatibilidad agrupa posiciones FIFA (p. ej. DFC puede jugar LD/LI, ED puede jugar MD/EI/SD, etc.) y mapea las posiciones genéricas (GK/DEF/MID/FWD) a posiciones FIFA.

#### Scenario: Ofrecer candidatos compatibles
- **WHEN** el usuario toca un slot vacío
- **THEN** se sugieren jugadores de la plantilla disponibles que pueden jugar en esa posición.

### Requirement: Capitán
El sistema MUST permitir marcar un integrante titular como capitán; el capitanId se guarda en el store y se limpia si el jugador se quita del equipo.

#### Scenario: Asignar capitán
- **WHEN** el usuario elige un jugador como capitán
- **THEN** esa elección queda persistida en el store y se refleja en la cancha.

### Requirement: Validación de plantilla (11 + 7)
El sistema MUST impedir avanzar hasta completar 18 jugadores (11 titulares + 7 suplentes), y bloquear exceder ese límite.

#### Scenario: Intentar continuar incompleto
- **WHEN** faltan jugadores por asignar
- **THEN** se muestra cuántos faltan y no se avanza.
#### Scenario: Plantilla lista
- **WHEN** hay 11 titulares + 7 suplentes
- **THEN** se habilita avanzar al torneo.