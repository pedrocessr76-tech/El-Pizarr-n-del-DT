# Despliegue B2B en Render

Durante el MVP se utiliza una única instancia PostgreSQL Free por las limitaciones del plan de Render, pero con dos bases lógicas independientes:

- `pizarron_dt`: juego original.
- `sistema_canchas`: Sistema Canchas.

El servicio API recibe conexiones separadas mediante `DB_*` y `B2B_DB_*`. El frontend es un único Static Site con dos entradas directas:

- `/dt`: El Pizarrón del DT.
- `/canchas`: Sistema Canchas.

## Preparación única de la base B2B

Después de crear `el-pizarron-db`, ejecutar una vez contra la conexión externa de Render:

```sql
CREATE DATABASE sistema_canchas;
```

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