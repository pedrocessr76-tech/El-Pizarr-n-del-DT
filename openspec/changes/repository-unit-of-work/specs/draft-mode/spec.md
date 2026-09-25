## MODIFIED Requirements

### Requirement: Sobre inicial y selección de jugador
El draft MUST partir de un sobre de 5 jugadores obtenidos vía `GET /draft/pack`. Al tocar una carta el jugador queda marcado para el equipo; el frontend lo persiste vía `POST /draft/team/player`. Los sobres pueden solicitar una posición concreta (`?position=DC`), devolviendo jugadores compatibles con esa posición. El acceso persistente del juego MUST realizarse mediante contratos de repositorio. Cuando un caso de uso de draft realice varias escrituras que deban ser atómicas, MUST ejecutarlas dentro de una misma unidad de trabajo del datasource del juego.

#### Scenario: Abrir un sobre
- **WHEN** el usuario solicita un sobre
- **THEN** se muestran 5 cartas de jugadores disponibles para incorporar
#### Scenario: Elegir jugador
- **WHEN** el usuario toca una carta del sobre
- **THEN** el jugador se agrega al equipo (persistido si corresponde) y el resto del sobre se descarta
#### Scenario: Acceso a datos del draft
- **WHEN** un caso de uso del draft lee o persiste datos
- **THEN** usa contratos de repositorio implementados por la infraestructura del juego
#### Scenario: Escrituras atómicas del draft
- **WHEN** una operación de draft realiza varias escrituras que deben completarse como una sola unidad
- **THEN** todas se confirman juntas o se revierten juntas mediante la unidad de trabajo del juego
