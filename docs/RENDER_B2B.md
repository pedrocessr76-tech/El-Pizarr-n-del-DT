# Despliegue B2B en Render

Se usa **una sola instancia PostgreSQL Free de Render** (el plan gratuito no permite pagar una segunda base). Dentro de esa misma instancia hay **dos bases lógicas independientes**, sin compartir tablas:

- Base del juego original (la que crea Render para `el-pizarron-db`).
- Base `sistema_canchas` (Sistema Canchas), con prefijo `b2b_*` en sus tablas.

El backend NestJS abre dos conexiones separadas vía `DB_*` (juego) y `B2B_DB_*` (Sistema Canchas), ambas apuntando al mismo host/puerto/usuario de `el-pizarron-db`, difiriendo solo en el nombre de base (`DB_NAME` vs `B2B_DB_NAME`). El frontend es un único Static Site con dos entradas directas:

- `/dt`: El Pizarrón del DT.
- `/canchas`: Sistema Canchas.

El `render.yaml` mapea `B2B_DB_*` a la misma instancia `el-pizarron-db` (`fromDatabase`) y fija `B2B_DB_NAME = sistema_canchas`.

## Creación automática de la base `sistema_canchas`

Al arrancar, el API (`apps/server/src/main.ts`) verifica si la base `sistema_canchas` existe en la instancia compartida; si no, la **crea automáticamente** (`CREATE DATABASE`). No hace falta correr SQL a mano. Luego ejecuta la migración B2B (`B2B_DB_MIGRATIONS=true`). El seed B2B (`B2B_SEED`) queda restringido a desarrollo: en producción se ignora además por `NODE_ENV=production`.

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

Luego el servicio API ejecuta la migración B2B con `B2B_DB_MIGRATIONS=true`.

## Alta de propietario (producción)

El seed con credenciales demo (`admin@lacancha.com.ar` / `canchas-demo`) **no existe en producción**. Para dar de alta el primer dueño de un complejo sin credenciales conocidas, el frontend de **Sistema Canchas** ofrece el **onboarding de propietario** que usa `POST /api/v1/auth/onboarding` (nombre del complejo, sede inicial opcional, nombre del dueño, email y contraseña). Crea la organización y su cuenta `OWNER`, y **manda el email de verificación**: el dashboard se abre recién después de que la persona confirme el enlace (ver *Verificación de email*).

Recordatorio: `B2B_SEED` debe quedar en `false` (o ausente) en Render; el seed está pensado solo para desarrollo local (Docker).

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
MESSAGING_PROVIDER_EMAIL / _WHATSAPP -> proveedor por canal (log | smtp)
SMTP_*               -> credenciales del mailbox del complejo
B2B_PUBLIC_URL       -> URL pública del cliente: arma el enlace de verificación
B2B_DISPOSABLE_EMAIL_DOMAINS -> dominios tempmail bloqueados (lista propia)
```

## Verificación de email

Ninguna cuenta entra al sistema con el email sin confirmar: `login` y
`refresh` rechazan con `401` mientras `emailVerified` sea `false`. El registro
de clientes y el onboarding de propietarios **ya no devuelven JWT**: crean la
cuenta y mandan el enlace, y la persona entra recién después de confirmarlo.

```text
registro / onboarding  ->  cuenta creada + email enviado (sin sesión)
POST /auth/verify-email         ->  canjea el token, marca emailVerified
POST /auth/resend-verification  ->  rota el token y reenvía
GET  /canchas/verificar-email?token=...  ->  pantalla que llama al endpoint
```

### Política de tokens

- 32 bytes aleatorios en hexadecimal; en la base sólo queda el hash SHA-256.
- Vencen a los **30 minutos** y son de **un solo uso**: al canjearse, el token
  queda con `usedAt` y un segundo intento responde "ese enlace ya se usó".
- Pedir uno nuevo **invalida** los pendientes previos de esa cuenta.
- Tras 10 intentos fallidos el enlace se bloquea (`attempts`) y hay que reenviar.
- El token viaja en la query del enlace por ser un `GET`; la pantalla lo borra
  de la URL apenas lo canjea para no dejarlo en el historial.

### Entrega del email

El enlace se arma con `B2B_PUBLIC_URL`. **Sin esa variable el link sale con el
default `http://localhost:5173`**, que en producción apuntaría al dominio
equivocado: hay que definirla en Render con la URL pública del cliente.

El envío reutiliza `MessagingService` de los recordatorios (#34). Con
`MESSAGING_PROVIDER_EMAIL=log` (o `smtp` sin credenciales) el servidor **no
falla**: degrada a log e imprime el enlace en la salida del contenedor, así se
puede completar el alta a mano en desarrollo.

```bash
docker logs pizarron_dt_server | grep verificar-email
```

### Dominios desechables

`B2B_DISPOSABLE_EMAIL_DOMAINS` acepta una lista separada por comas; si se deja
vacía se usa la lista mínima por defecto. Bloquearlos evita que alguien se
registre con un tempmail y reutilice el teléfono real de otra persona en las
notificaciones de WhatsApp. El mensaje de rechazo es genérico: no revela la
lista.

### Usuarios existentes

La migración agrega `emailVerified` con default `false` y **no hay grace
period**: toda cuenta preexistente queda con el acceso bloqueado y tiene que
confirmar su email por el enlace. Es aceptable acá porque la base era de pruebas
y se reseteó, pero en una base con usuarios reales hay que avisar antes de
desplegar la migración oExpense el alta de todo el mundo.

## Recordatorios de reserva (#34)

Los recordatorios van por dos canales con tiempos de reacción distintos.

### Email: automático, 24 h antes

El servidor envía solo. Sale por SMTP con `nodemailer` contra cualquier mailbox
propio o de un proveedor gratuito. No requiere opt-in adicional del cliente: es
comunicación transaccional sobre una reserva que él mismo hizo.

En Render, completar las variables marcadas `sync: false` en `render.yaml`:

```text
MESSAGING_PROVIDER_EMAIL=smtp
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=reservas@tu-dominio.com.ar
SMTP_FROM_NAME=Sistema Canchas
SMTP_USER=reservas@tu-dominio.com.ar
SMTP_PASSWORD=<clave de aplicación, no la clave de la cuenta>
```

Gmail exige "contraseña de aplicación" y Google rechaza remitentes que no
terminen en el mismo dominio que `SMTP_HOST`.

**Verificar que el email sale:**

1. Con `MESSAGING_PROVIDER_EMAIL=smtp` y las credenciales completas, arrancar el
   API y mirar el arranque: si falta `SMTP_HOST` el canal cae a `log`.
2. Crear una reserva de prueba con un turno dentro de las próximas 24 h. El
   procesador corre cada 60 s, así que no hay que esperar al día anterior.
3. Consultar la entrega:

   ```sql
   SELECT "channel", "minutesBefore", status, provider, "lastError", "processedAt"
   FROM b2b_booking_reminders
   WHERE "bookingId" = '<id-de-la-reserva>'
   ORDER BY "minutesBefore";
   ```

4. Estados esperados: `SENT` (entregado por SMTP) o `FAILED` con `lastError`.
   Si el proveedor quedó en `log`, el estado es `SIMULATED`: el registro existe
   pero nadie recibió nada.
5. `FAILED` es reintentable: el siguiente ciclo lo reclama otra vez. `SENT`,
   `SIMULATED` y `SKIPPED` son terminales.

**Si no hay SMTP configurado** no hace falta tocar nada: el canal cae a `log`,
el envío queda como `SIMULATED` y el panel lo advierte. El despliegue arranca
igual.

### WhatsApp: manual, 30 min antes

El aviso corto **no se envía desde el servidor** y no es una limitación
pendiente de cerrar. Automatizarlo requiere una de dos cosas:

- **Meta Cloud API (WhatsApp Business Platform):** es la única vía oficial. La
  conversación fuera de la ventana de 24 h se cobra por mensaje, así que solo
  sirve con plantillas aprobadas y normalmente requiere una cuenta de negocio
  verificada. No hay modalidad gratuita ilimitada.
- **Sesión no oficial (Baileys, whatsapp-web.js, WAHA):** sin costo, pero
  reproduce el protocolo de WhatsApp y puede ser baneada. Además Render Free
  duerme los servicios y una sesión persistente por WebSocket no sobrevive.

Por eso el servidor arma el mensaje y lo deja en **Avisos pendientes** dentro
del dashboard. El personal abre el chat con un deep link `wa.me` (mensaje
precargado) o copia teléfono y texto, y confirma el despacho con "Ya lo mandé".
Esa confirmación es *best effort*: el envío ocurre en el teléfono, así que el
servidor no puede verificarlo; lo que evita es que el aviso vuelva a ofrecerse.

Los avisos solo se generan para clientes con teléfono y opt-in de WhatsApp
cargados en su perfil.

### Migración de base

El cambio de esquema es la migración `1710000000005-AddB2bReminderChannels`
(columna `emailReminderIntervalsMinutes`, columna `channel` en las entregas e
índice único por reserva + canal + anticipación). Con `B2B_DB_MIGRATIONS=true`
corre sola al arrancar. Para aplicarla a mano:

```powershell
npm run migration:run --workspace=server
```

El `down()` deduplica por anticipación antes de volver a la clave anterior,
porque un mismo aviso puede existir en los dos canales.

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