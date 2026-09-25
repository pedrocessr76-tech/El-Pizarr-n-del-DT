## ADDED Requirements

### Requirement: Atomicidad de unidad de trabajo
El servidor MUST ofrecer una unidad de trabajo que ejecute un caso de uso sobre una sola conexión en una transacción y proporcione repositorios vinculados a esa transacción.

#### Scenario: Unidad de trabajo exitosa
- **WHEN** el callback de la unidad de trabajo finaliza exitosamente
- **THEN** se confirman juntas las escrituras realizadas por sus repositorios

#### Scenario: Error dentro de unidad de trabajo
- **WHEN** una operación del callback falla
- **THEN** se revierten todas las escrituras de esa unidad y el error se propaga al llamador

#### Scenario: Varios repositorios participan
- **WHEN** un caso de uso escribe usando dos o más repositorios dentro de la misma unidad
- **THEN** todos operan sobre el mismo contexto transaccional y sus cambios se confirman o revierten juntos

### Requirement: Aislamiento por conexión
Cada unidad de trabajo MUST estar asociada a un único datasource y MUST NOT presentar atomicidad entre las conexiones independientes del juego y B2B.

#### Scenario: Unidad de juego
- **WHEN** una unidad de trabajo de juego obtiene repositorios
- **THEN** estos ejecutan consultas y cambios únicamente a través de la conexión de juego

#### Scenario: Unidad B2B
- **WHEN** una unidad de trabajo B2B obtiene repositorios
- **THEN** estos ejecutan consultas y cambios únicamente a través de la conexión B2B

#### Scenario: Intento de asumir atomicidad entre conexiones
- **WHEN** un flujo requiere cambios en ambas conexiones
- **THEN** el sistema no los presenta como una transacción atómica única y el flujo requiere coordinación explícita fuera del Unit of Work
