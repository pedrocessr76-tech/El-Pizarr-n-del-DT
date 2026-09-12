# Despliegue B2B en Render

Se usa **una sola instancia PostgreSQL Free de Render** (el plan gratuito no permite pagar una segunda base). Dentro de esa misma instancia hay **dos bases lógicas independientes**, sin compartir tablas:

- Base del juego original (la que crea Render para `el-pizarron-db`).
- Base `sistema_canchas` (Sistema Canchas), con prefijo `b2b_*` en sus tablas.

El backend NestJS abre dos conexiones separadas vía `DB_*` (juego) y `B2B_DB_*` (Sistema Canchas), ambas apuntando al mismo host/puerto/usuario de `el-pizarron-db`, difiriendo solo en el nombre de base (`DB_NAME` vs `B2B_DB_NAME`). El frontend es un único Static Site con dos entradas directas:

- `/dt`: El Pizarrón del DT.
- `/canchas`: Sistema Canchas.

El `render.yaml` mapea `B2B_DB_*` a la misma instancia `el-pizarron-db` (`fromDatabase`) y fija `B2B_DB_NAME = sistema_canchas`.

## Creación automática de la base `sistema_canchas`

Al arrancar, el API (`apps/server/src/main.ts`) verifica si la base `sistema_canchas` existe en la instancia compartida; si no, la **crea automáticamente** (`CREATE DATABASE`). No hace falta correr SQL a mano. Luego ejecuta la migración B2B (`B2B_DB_MIGRATIONS=true`) y carga el seed (`B2B_SEED=true`).

> Requisito: el usuario de la instancia debe tener permiso `CREATE DATABASE`. Es el caso por defecto para el usuario principal que Render crea para `el-pizarron-db`. Si tu usuario no tuviera permiso, creá la base una vez desde el shell de Render:
> `CREATE DATABASE sistema_canchas;`

## Si el API falla con `ECONNREFUSED` en `b2b`

En un servicio Render existente, un cambio en `render.yaml` no siempre actualiza automáticamente las variables ya creadas. En `el-pizarron-api`, revisar/agregar manualmente que `B2B_DB_*` apunten a la misma instancia de `el-pizarron-db` pero con `B2B_DB_NAME = sistema_canchas`:

```text
B2B_DB_HOST       = mismo host de el-pizarron-db
B2B_DB_PORT       = mismo puerto de el-pizarron-db
B2B_DB_USER       = mismo usuario de el-pizarron-db
B2B_DB_PASSWORD   = misma clave de el-pizarron-db
B2B_DB_NAME       = sistema_canchas
B2B_DB_SSL        = true
B2B_DB_MIGRATIONS = true
```

El código conserva fallbacks a `DB_*` por compatibilidad. No dejar `B2B_DB_HOST` en `localhost`.

Después de guardar las variables, ejecutar un nuevo deploy del servicio API.

Luego el servicio API ejecuta la migración B2B con `B2B_DB_MIGRATIONS=true` y carga el seed cuando `B2B_SEED=true`.

El healthcheck productivo del API usa `/health/b2b`, que ejecuta `SELECT 1` contra la conexión B2B y evita considerar saludable un backend cuya base de reservas esté caída.

El dashboard puede consultar `GET /api/v1/metrics/summary` con JWT B2B para medir turnos, ocupación, estados de reserva e ingresos confirmados en ARS por fecha.

La base Free de Render sirve para demo/MVP: tiene 1 GB, expira a los 30 días y no tiene backups administrados. Para reservas de producción se debe mover `sistema_canchas` a una base paga independiente.

## Variables relevantes

```text
DB_*                 -> pizarron_dt
B2B_DB_*             -> sistema_canchas
B2B_JWT_SECRET       -> JWT exclusivo del B2B
VITE_API_URL         -> URL pública del API
VITE_B2B_ENABLED     -> habilita o deshabilita /canchas
```

## Smoke test local

Con Docker Compose activo, ejecutar:

```powershell
npm run test:b2b --workspace=server
```

El script valida login de administrador y cliente, disponibilidad, reserva autenticada, conflicto de doble reserva, confirmación, cancelación y rechazo de reservas anónimas.

## Backup manual

Con `pg_dump` instalado y las variables `B2B_DB_*` configuradas, ejecutar:

```powershell
./scripts/backup-b2b.ps1
```

En Render Free los backups administrados no están disponibles; este backup debe almacenarse fuera del contenedor. Para producción, usar una instancia PostgreSQL paga con backups administrados.

En desarrollo Docker, donde `pg_dump` está dentro del contenedor PostgreSQL:

```powershell
cmd /c "docker exec sistema_canchas_db pg_dump -U canchas -d sistema_canchas -Fc > backups\sistema_canchas_$(Get-Date -Format yyyyMMdd_HHmmss).dump"
```