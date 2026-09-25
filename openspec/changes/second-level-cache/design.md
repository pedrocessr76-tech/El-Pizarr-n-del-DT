## Context

El backend usa NestJS 10 y TypeORM 1.1 sobre PostgreSQL, con dos `DataSource` independientes: juego y B2B. El acceso de aplicación pasa por `RepositoryPort` y sus adaptadores, por lo que esa capa permite elegir lecturas explícitamente sin añadir lógica de caché a controladores ni servicios.

TypeORM ofrece caché de resultados para consultas `find*`, `count*` y `QueryBuilder`, y admite Redis como backend. Esto es caché de resultados SQL, no una caché automática del estado de entidades al estilo Hibernate. La diferencia debe permanecer clara en documentación y nombres internos.

## Goals / Non-Goals

**Goals:**

- Reducir consultas repetidas en lecturas estables de catálogo mediante la caché de resultados de TypeORM.
- Mantener las conexiones y claves de juego y B2B aisladas aunque compartan el mismo servicio Redis.
- Habilitar caché sólo para lecturas declaradas cacheables, con TTL finito y claves deterministas que incluyan filtros/paginación.
- Invalidar los resultados afectados después de que una escritura confirme; no publicar una invalidación antes del commit.
- Ante error o ausencia del backend cache, continuar con PostgreSQL sin cambiar la respuesta funcional.

**Non-Goals:**

- Cachear todas las consultas o entidades automáticamente.
- Cachear autenticación, autorización, datos de sesión, reservas, disponibilidad, escrituras o lecturas transaccionales.
- Cambiar contratos HTTP, esquemas de negocio o límites transaccionales entre las dos bases.
- Garantizar invalidación atómica distribuida con el commit SQL; el TTL finito limita el impacto de un fallo de invalidación.

## Decisions

1. **Usar el query-result cache nativo de TypeORM sobre Redis.** TypeORM ya integra `QueryResultCache` y su backend Redis, evitando crear un segundo mecanismo paralelo. Se añadirá el cliente Redis compatible con la versión instalada si no es una dependencia transitiva utilizable directamente. Se descartó un `cache-manager` genérico porque duplicaría el cache-aside y la traducción de consultas que el ORM ya resuelve.

2. **Configurar cada DataSource por separado con prefijo propio.** La misma URL Redis puede servir a ambas áreas, pero el identificador/prefijo debe incluir `game` o `b2b`; los valores son configurables por entorno. La configuración de CLI y runtime debe coincidir para que migraciones y consultas utilicen las mismas opciones. La caché se puede apagar por datasource.

3. **Opt-in en adaptadores Repository y catálogo.** Los métodos CRUD continúan sin caché por defecto. Los métodos de lectura declarados aptos pasan opciones de cache a TypeORM. Para resultados parametrizados, la clave deriva de datasource, entidad/consulta, filtros y paginación normalizados; nunca incluye credenciales ni datos personales innecesarios. Las consultas complejas de catálogo activan caché explícitamente desde el adaptador TypeORM.

4. **Invalidación por clave conocida tras commit y TTL como límite.** Cada consulta cacheable tiene claves identificables por área y grupo de datos. Las escrituras que puedan afectar ese grupo quitan esas claves sólo después de completar el commit (en flujos UoW, una vez resuelto `execute`). Las variantes de filtro se registran bajo el grupo para eliminar el conjunto afectado. Si Redis falla durante lectura, se lee de PostgreSQL; si falla la invalidación, se registra el error y el TTL corto acota datos obsoletos. Esta decisión no promete consistencia lineal distribuida.

5. **No servir caché en transacciones.** Los repositorios creados por `UnitOfWork` no activan caché para lecturas dentro de `execute`, para que no se eludan visibilidad, aislamiento o escrituras no confirmadas de la transacción. Los writes directos del port invalidan después de que la operación termine correctamente.

6. **Empezar con el catálogo de jugadores.** Es una lectura repetida, poco sensible y ya está encapsulada en un port propio. Otros grupos sólo se incorporan con evidencia de lecturas repetidas y una regla explícita de invalidación.

## Risks / Trade-offs

- **Redis añade infraestructura y configuración operativa** → Mantener la caché opcional y fail-open; documentar variables, health/telemetría y despliegue.
- **Invalidación incompleta puede exponer valores viejos hasta el TTL** → Centralizar claves/grupos en infraestructura, invalidar sólo tras éxito y usar TTL breve y documentado.
- **Claves de criterios pueden colisionar o filtrar datos** → Canonicalizar y hashear criterios, incluir namespace/datasource, no serializar secretos y cubrir aislamiento con pruebas.
- **TypeORM puede crear su tabla de resultados en el backend database si la configuración Redis falta** → Prohibir fallback silencioso a tabla de caché; configuración inválida deshabilita la caché y emite diagnóstico, dejando PostgreSQL de negocio como fuente de verdad.
- **Los resultados de TypeORM pueden requerir serialización compatible con entidades/fechas** → Probar round-trip de las formas cacheadas y restringir inicialmente el alcance al resultado de catálogo.

## Migration Plan

1. Añadir configuración opcional de Redis y el cliente requerido; mantener caché deshabilitada por defecto hasta que el servicio esté disponible.
2. Configurar providers de caché separados en los dos DataSource de runtime y CLI, con namespaces independientes.
3. Añadir contratos/helpers de infraestructura para claves de cache, lectura cacheable e invalidación; conservar las lecturas existentes como no cacheables por defecto.
4. Activar el cache en el catálogo de jugadores y conectar sus escrituras/migraciones de datos con la invalidación posterior al commit.
5. Desplegar Redis y habilitar la variable de entorno por área. Rollback: apagar la caché por configuración y retirar la conexión Redis; PostgreSQL sigue siendo fuente de verdad y no se requieren migraciones de negocio.

## Open Questions

- ¿Qué proveedor Redis y variables exactas estarán disponibles en Render para producción y en desarrollo local? La implementación debe admitir configuración opcional y documentar el contrato elegido.
- ¿Cuál es el TTL aceptable para el catálogo en producción? Propuesta inicial: 60 segundos, sujeto a la frecuencia real de sincronización.
