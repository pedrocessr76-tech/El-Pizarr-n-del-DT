## Why

Los servicios NestJS acceden a TypeORM directamente, lo que acopla la lógica de negocio al ORM y hace difícil asegurar que varias escrituras relacionadas compartan una misma transacción. Una capa de repositorios y una unidad de trabajo común darán límites de persistencia claros y permitirán completar o revertir juntas las operaciones de cada caso de uso.

## What Changes

- Definir contratos de repositorio propios para encapsular consultas y persistencia, con adaptadores TypeORM.
- Definir una unidad de trabajo que ejecute operaciones transaccionales y entregue repositorios ligados al contexto transaccional.
- Aplicar ambos patrones en todos los accesos a bases de datos del backend, incluidos juego, B2B, procesos de inicialización y tareas en segundo plano.
- Mantener separados los límites de transacción de las conexiones de juego y B2B; no simular transacciones distribuidas entre bases de datos.
- Mantener TypeORM y PostgreSQL. No cambiar la API HTTP ni introducir una migración de ORM como parte de esta propuesta.

## Capabilities

### New Capabilities

- `data-model`: Persistencia del dominio a través de contratos de repositorio y adaptadores, preservando el esquema y los datos actuales.
- `repository-unit-of-work`: Acceso desacoplado a datos y coordinación atómica de escrituras dentro de una conexión.

### Modified Capabilities

- `draft-mode`: El acceso persistente del juego debe cumplir los contratos de repositorio y ejecutar escrituras relacionadas bajo una unidad transaccional cuando el caso de uso lo requiera.

## Impact

- Backend NestJS: módulos, servicios y proveedores de acceso a datos en `apps/server`, tanto para la conexión principal como para B2B.
- Pruebas unitarias e integración del backend: servicios usando contratos sustituibles y verificaciones de commit/rollback de la unidad de trabajo.
- Dependencias: se conserva TypeORM. La investigación encontró que TypeORM ya ofrece repositorios y transacciones; `typeorm-transactional` ofrece propagación ambientada mediante AsyncLocalStorage, mientras MikroORM incorpora un Unit of Work con seguimiento de cambios, pero requeriría migrar el ORM. Esta propuesta no requiere ninguna de esas dependencias adicionales: el adaptador puede resolver el contexto transaccional explícitamente con el `EntityManager` de TypeORM.
- Sin cambios en rutas HTTP, clientes frontend ni esquema de base de datos, salvo que la implementación descubra una necesidad concreta que deberá documentarse en su propio cambio.
