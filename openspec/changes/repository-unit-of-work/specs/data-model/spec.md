## ADDED Requirements

### Requirement: Persistencia desacoplada por repositorios
La capa de aplicación del servidor MUST acceder a entidades persistidas mediante contratos de repositorio definidos por el proyecto. Los adaptadores de infraestructura MAY usar TypeORM, pero los servicios/casos de uso MUST NOT depender directamente de `Repository<Entity>`, `EntityManager` ni QueryBuilder.

#### Scenario: Servicio ejecuta una consulta de dominio
- **WHEN** un caso de uso necesita recuperar o modificar datos persistidos
- **THEN** invoca un contrato de repositorio y la implementación TypeORM ejecuta la operación

#### Scenario: Prueba unitaria sin base de datos
- **WHEN** se prueba un servicio de aplicación
- **THEN** sus contratos de repositorio pueden sustituirse por implementaciones de prueba sin iniciar una conexión TypeORM

### Requirement: Integridad del modelo persistido
La introducción de interfaces y adaptadores MUST conservar las entidades, tablas, relaciones, restricciones y datos existentes, excepto si otro cambio aprobado especifica una migración.

#### Scenario: Adaptador lee datos existentes
- **WHEN** una consulta se realiza mediante un adaptador nuevo
- **THEN** devuelve la información correspondiente al mismo modelo persistido que usaba la implementación anterior
