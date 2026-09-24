## Why

Los recordatorios de pago, confirmaciones de seña (#37) y los envíos programados (#34, #36) requieren un **canal WhatsApp** que hoy no existe. Además, el perfil de usuario B2B no tiene número de teléfono ni consentimiento para recibir mensajes, así que no hay forma de contactar al cliente por fuera de la app. Sin esto, ninguna de las funcionalidades de mensajería del roadmap puede existir.

## What Changes

- Agregar **campo de WhatsApp** (`whatsappPhone`) y **consentimiento explícito** (`whatsappOptIn`) al perfil de **cliente** (`b2b_users`) y de **organización** (`b2b_organizations`) en Sistema Canchas.
- Nuevo endpoint **`PATCH /api/v1/auth/profile`** (auth) para que el usuario cargue/actualice su número y dé/revogue el consentimiento.
- Exponer el teléfono y consentimiento en `GET /api/v1/auth/me`.
- Formulario de perfil en el frontend B2B para **cliente y staff** donde se carga el WhatsApp y se acepta el opt‑in.
- Servicio de **mensajería desacoplado** (`MessagingService`): interfaz única + adaptador **placeholder/logger** para desarrollo que registra los envíos sin salir de la app. Configurable por variables de entorno, listo para enchufar un proveedor real (WhatsApp Cloud API / whatsapp-web.js) después, sin tocar consumidores.
- Validación de formato de WhatsApp (cód. país + dígitos) y regla de negocio: **no se envía nada si no hay opt‑in**.

## Capabilities

### New Capabilities
- `client-contact-profile`: dato de contacto WhatsApp y consentimiento del cliente/staff y organización, con gestión desde el perfil, en Sistema Canchas.
- `messaging-delivery`: envío de mensajes por WhatsApp de forma desacoplada del proveedor (adaptador de envío + placeholder en dev + configuración por entorno).

### Modified Capabilities
<!-- Ninguna capability existente cambia comportamiento a nivel de spec: la identidad, reset de sesión y roles B2B se mantienen tal cual. -->

## Impact

- **Backend** (`apps/server/src/b2b`):
  - `entities/user.entity.ts` y `entities/organization.entity.ts`: nuevas columnas.
  - Nueva migración `apps/server/src/b2b/migrations/` (synchronize=false en B2B).
  - `auth/b2b-auth.service.ts` / `b2b-auth.controller.ts`: `PATCH profile`, `me` enriquecido.
  - Nuevo módulo `messaging/` (interfaz + adaptador placeholder logger).
  - `b2b.module.ts` / `data-source.ts`: registro de entidad migrada y módulo.
- **Frontend** (`apps/client/src`): vista de perfil en `B2bApp.tsx` (cliente y staff), `b2bService.ts` (nuevo método), posibles componentes nuevos.
- **Config**: `.env.example` y `render.yaml` (vars de messaging, opcionales en esta etapa).
- **Tests**: unit de validación/reglas de opt‑in y de la migración, siguiendo el patrón de specs existentes en `apps/server/src/b2b/migrations/*.spec.ts`.