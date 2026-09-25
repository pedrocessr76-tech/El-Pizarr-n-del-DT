## Context

Los servicios del servidor reciben repositorios de TypeORM directamente y mezclan consultas, persistencia y reglas de negocio. Hay al menos dos conexiones PostgreSQL con ámbitos diferentes (juego y B2B). TypeORM ya ofrece el patrón Repository básico y transacciones explícitas; sin embargo, sus transacciones sólo son correctas cuando todas las operaciones usan el `EntityManager` transaccional proporcionado por la transacción.

La investigación de alternativas encontró:

- **TypeORM nativo**: ofrece repositorios, repositorios personalizados y `DataSource.transaction`, pero no un Unit of Work con seguimiento de cambios/Identity Map al estilo de MikroORM.
- **`typeorm-transactional`**: integra propagación de contexto transaccional por AsyncLocalStorage y decoradores. Evita pasar el contexto a mano, pero agrega comportamiento ambientado y dependencia de una librería de terceros.
- **MikroORM**: incorpora Unit of Work, Identity Map, seguimiento de cambios y transacciones al hacer `flush`; su integración NestJS es oficial, pero adoptarlo exige migrar entidades, consultas, módulos y migraciones.

## Goals / Non-Goals

**Goals:**

- Desacoplar todos los casos de uso del servidor de los repositorios concretos de TypeORM.
- Hacer que una unidad de trabajo controle la transacción y provea repositorios ligados a esa misma transacción.
- Mantener el alcance de cada unidad dentro de una conexión/datasource, cubriendo tanto juego como B2B.
- Permitir pruebas unitarias de servicios con implementaciones sustitutas y pruebas de integración que validen commit y rollback.

**Non-Goals:**

- Migrar a MikroORM u otro ORM, añadir seguimiento automático de cambios o construir un Identity Map propio.
- Ejecutar transacciones distribuidas entre las conexiones del juego y B2B.
- Cambiar endpoints, contratos de API, esquema de base de datos o comportamiento observable del producto.
- Envolver cada lectura o escritura simple en una transacción si no hay un caso de uso que requiera atomicidad entre varias operaciones.

## Decisions

### 1. Mantener TypeORM y exponer contratos de repositorio propios

Cada entidad persistida recibe un token de inyección distinto y una instancia de `RepositoryPort<Entity>`, con un adaptador TypeORM compartido en infraestructura. El contrato común expone sólo operaciones de lectura/escritura necesarias en el proyecto y opciones propias; no expone QueryBuilder, EntityManager ni tipos de TypeORM. Las consultas específicas deben encapsularse como métodos del repositorio cuando su complejidad o volumen lo justifique. La implementación inicial mantiene las búsquedas del catálogo en el servicio como filtros sobre los datos recuperados.

**Alternativas consideradas:**

- Inyectar `Repository<Entity>` de TypeORM directamente: es lo actual y mantiene acoplamiento ORM en todos los servicios.
- Migrar a MikroORM: aporta un UoW con change tracking, pero aumenta mucho el alcance, riesgo y costo de migración.

### 2. Unidad de trabajo explícita y transaccional, sin contexto ambientado

Proveer una API de unidad de trabajo que acepte un callback asíncrono y le entregue un contexto con repositorios. Para TypeORM, la implementación abrirá `DataSource.transaction(...)`, construirá adaptadores desde el `EntityManager` recibido y ejecutará el callback. Una excepción debe provocar rollback y propagarse; el retorno exitoso confirma la transacción. No se permitirá que un adaptador usado dentro del callback recurra a un repositorio global.

**Alternativas consideradas:**

- `typeorm-transactional` con AsyncLocalStorage/decoradores: candidato válido si el paso explícito de contexto vuelve la migración impráctica; se pospone para evitar efectos implícitos y dependencia no necesaria.
- Usar directamente `EntityManager` en servicios: preserva transacciones pero no crea una unidad de persistencia desacoplada ni repositorios propios.

### 3. Un límite de unidad por datasource

La unidad de trabajo se configura y registra por conexión (juego o B2B); sus repositorios sólo pueden operar en esa misma conexión. Si un caso de uso necesita coordinar ambos dominios, se documentará como no atómico y requerirá consistencia compensatoria explícita fuera de este cambio.

### 4. Cobertura integral del backend con migración incremental por feature

Inventariar todo uso de `@InjectRepository`, `DataSource`, `EntityManager`, QueryRunner y SQL directo dentro de `apps/server`. Migrar servicios y procesos de inicialización/consumidores gradualmente por módulo, manteniendo temporalmente sus módulos compilables en cada paso. Al final, los servicios de aplicación no deben importar tipos ni decoradores de persistencia de TypeORM; los adaptadores y configuración sí pueden hacerlo.

## Risks / Trade-offs

- [Muchos puntos de acceso a datos hacen la migración amplia] → Inventariar por datasource y feature, migrar incrementalmente y mantener cobertura de compilación/pruebas en cada módulo.
- [Una llamada al repositorio equivocado puede salir de la transacción] → Crear todos los repositorios del callback exclusivamente desde el `EntityManager` transaccional; probar rollback con operaciones en más de un repositorio.
- [El contrato común puede crecer hasta replicar TypeORM] → Mantener su API limitada y extraer búsquedas complejas a métodos propios del repositorio cuando aparezcan; evitar exponer `Repository`, `EntityManager` o QueryBuilder fuera de infraestructura.
- [El Unit of Work no proporciona change tracking] → Definirlo explícitamente como límite de transacción y colaboración entre repositorios; no prometer semántica de ORM que TypeORM no implementa.
- [Existen varias conexiones] → Registrar y tipar contextos separados, y probar que repositorios B2B no se obtienen del datasource de juego ni viceversa.

## Migration Plan

1. Inventariar los accesos de datos y establecer contratos/UoW base para cada conexión.
2. Migrar módulos por feature, comenzando por los casos multi-escritura y transacciones existentes.
3. Migrar el resto de lecturas/escrituras y procesos de lifecycle; retirar la inyección directa de repositorios/manager de servicios.
4. Ejecutar compilación, pruebas unitarias y de integración de rollback, además de los flujos smoke existentes.

El cambio no requiere migración de datos. El rollback de código consiste en revertir el despliegue a la versión anterior; los adaptadores mantienen el mismo TypeORM y esquema.

## Open Questions

- Confirmar durante el inventario si los jobs, gateways o scripts fuera de `apps/server/src` realizan escrituras que también deban compartir una unidad transaccional.
- Precisar los tokens/interfaces y su estrategia de binding después de agrupar los accesos actuales por agregado y conexión.
