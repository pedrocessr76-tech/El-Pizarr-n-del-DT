# draft-mode

## Purpose

Definir la mecánica de draft del juego: cómo se obtienen jugadores (apertura de sobres), cómo se muestran como cartas estilo FUT y cómo se integran al armado del equipo, respetando las posiciones FIFA y el límite de plantilla.

## Requirements

### Requirement: Representación y rareza de la carta (FIFA-style)
El sistema MUST mostrar cada jugador como una carta vertical FIFA-style con: rating general grande (el elemento más visible), posición (POR/LD/LI/DFC/MCD/MC/MCO/MD/MI/ED/EI/SD/DC/ST), nombre y las 6 stats con barras. La rareza se determina por rating: **Oro ≥ 85**, **Plata 75-84**, **Bronce < 75**, cada una con colores, brillo y borde distintivos.

#### Scenario: Determinar la rareza de una carta
- **WHEN** una carta de rating ≥ 85 se renderiza
- **THEN** se muestra con estilo Oro (dorado/glow) y se le agrega el efecto metálico.
- **WHEN** una carta de rating entre 75 y 84 se renderiza
- **THEN** se muestra con estilo Plata (gris/luminoso).
- **WHEN** una carta de rating menor a 75 se renderiza
- **THEN** se muestra con estilo Bronce (marrón).

#### Scenario: Mostrar stats en la carta
- **WHEN** una carta se renderiza
- **THEN** el rating global es el número más grande y visible, y las demás stats se muestran más pequeñas pero legibles.

### Requirement: Sobre inicial y selección de jugador
El draft MUST partir de un sobre de 5 jugadores obtenidos vía `GET /draft/pack`. Al tocar una carta el jugador queda marcado para el equipo; el frontend lo persiste vía `POST /draft/team/player`. Los sobres pueden solicitar una posición concreta (`?position=DC`), devolviendo jugadores compatibles con esa posición.

#### Scenario: Abrir un sobre
- **WHEN** el usuario solicita un sobre
- **THEN** se muestran 5 cartas de jugadores disponibles para incorporar.
#### Scenario: Elegir jugador
- **WHEN** el usuario toca una carta del sobre
- **THEN** el jugador se agrega al equipo (persistido si corresponde) y el resto del sobre se descarta.