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

La base Free de Render sirve para demo/MVP: tiene 1 GB, expira a los 30 días y no tiene backups administrados. Para reservas de producción se debe mover `sistema_canchas` a una base paga independiente.

## Variables relevantes

```text
DB_*                 -> pizarron_dt
B2B_DB_*             -> sistema_canchas
B2B_JWT_SECRET       -> JWT exclusivo del B2B
VITE_API_URL         -> URL pública del API
VITE_B2B_ENABLED     -> habilita o deshabilita /canchas
```