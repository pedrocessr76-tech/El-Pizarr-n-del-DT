## Why

El servidor ejecuta lecturas repetidas de catálogos y otros datos compartidos, pero hoy cada lectura llega a PostgreSQL. Una caché de segundo nivel puede reducir esas consultas y su latencia, manteniendo invalidación explícita para que las escrituras no dejen datos obsoletos.

## What Changes

- Incorporar caché de resultados de lectura en la capa de persistencia existente, sin exponer APIs de TypeORM a los servicios de aplicación.
- Definir qué lecturas son cacheables, sus TTL, claves y eventos de invalidación; excluir por defecto datos de autenticación, autorización, reservas y lecturas dentro de transacciones.
- Mantener namespaces separados para las bases de juego y B2B y permitir desactivar la caché por configuración.
- Añadir configuración del backend compartido de caché y comportamiento de fallback a PostgreSQL cuando la caché no esté disponible.
- Agregar pruebas de hit/miss, expiración, invalidación, aislamiento entre datasources y fallback.

## Capabilities

### New Capabilities

- `second-level-cache`: caché compartida de resultados de lectura con TTL, aislamiento por datasource e invalidación coherente con las escrituras.

### Modified Capabilities

- Ninguna.

## Impact

- `apps/server/src/persistence/` y adaptadores Repository; configuración de los DataSource de juego y B2B.
- Dependencia/servicio de caché remoto, configuración de entorno y despliegue del backend.
- Lecturas de catálogo y otras consultas de baja volatilidad seleccionadas durante la implementación. No cambia el contrato HTTP ni el esquema funcional de las bases de datos.
