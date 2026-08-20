---
name: render-deploy
description: Prepare, configure, validate, and deploy applications on Render using Render Blueprints or the Render REST API. Use when Codex needs to deploy or operate Render PostgreSQL databases, Node/NestJS APIs, React/Vite web frontends, service environment variables, deployment status, or logs—especially for the El Pizarrón del DT monorepo.
---

# Despliegue en Render

Usar `RENDER_API_KEY` exclusivamente desde el entorno. Nunca escribir, mostrar, confirmar ni incluir el valor de esa clave en archivos, comandos registrados, `render.yaml`, Git o respuestas.

Antes de realizar una llamada mutante a la API de Render (crear, modificar, desplegar, suspender o eliminar), explicar el cambio concreto y solicitar confirmación. Las consultas de inventario, estado, logs y validación son de solo lectura.

## Autenticación y descubrimiento

1. Verificar que `RENDER_API_KEY` esté disponible sin revelar su valor:
   ```powershell
   if (-not $env:RENDER_API_KEY) { throw 'Definí RENDER_API_KEY en tu entorno de usuario.' }
   ```
2. Ejecutar `scripts/test-render-auth.ps1` para validar la clave y listar los servicios existentes.
3. Consultar la documentación oficial vigente de Render si se requiere un endpoint, campo de Blueprint o plan que pueda haber cambiado.

## Flujo de despliegue

1. Inspeccionar primero la estructura, scripts de build, variables de entorno y configuración de CORS. Si el repositorio contiene `.codegraph/`, usar CodeGraph antes de buscar o leer código.
2. Proponer un `render.yaml` seguro, sin valores secretos, con servicios y base de datos en la misma región. Usar referencias `fromDatabase` para las credenciales de PostgreSQL cuando sea posible.
3. Ejecutar el build local o de CI pertinente antes de crear recursos remotos.
4. Pedir confirmación explícita y, una vez otorgada, crear o sincronizar el Blueprint desde Render o su API.
5. Esperar el deploy, consultar eventos/logs y validar la ruta de salud o raíz de la API y la web pública.
6. Informar URL, identificadores de servicios, variables que el usuario aún deba cargar como secretos y cualquier paso de migración o seed pendiente.

## Reglas de seguridad y operación

- No guardar `RENDER_API_KEY`, contraseñas de PostgreSQL, JWT ni otras credenciales en el repositorio.
- Declarar secretos de aplicación con `sync: false` o `generateValue: true`; cargarlos en Render manualmente cuando corresponda.
- Evitar destruir o recrear bases de datos. Respaldar y pedir confirmación antes de operaciones irreversibles.
- Preferir la conexión interna de Render de la API al Postgres; no abrir la base de datos al público salvo una necesidad explícita.
- No asumir que un servicio existente puede ser administrado sin comprobarlo primero mediante la API o Dashboard.

## Configuración conocida de este repositorio

Leer `references/el-pizarron-del-dt.md` al desplegar este proyecto. Adaptar las instrucciones si el código cambia.
