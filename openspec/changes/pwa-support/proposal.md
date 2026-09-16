## Why

El producto es una SPA que hoy solo se usa desde el navegador y se recarga entera en cada despliegue, sin avisar al usuario de que hay una versión nueva. Convertir la aplicación en una PWA instalable (con manifest, iconos y service worker) mejora la retención móvil al permitir instalarla como app nativa, y un aviso de actualización evita que los usuarios sigan operando sobre una versión vieja.

## What Changes

- Convertir `apps/client` en una PWA instalable: `manifest.webmanifest`, iconos de la app en varios tamaños (incluido `maskable`), metadatos en `index.html` (theme-color, apple-touch-icon, meta tags de instalación).
- Registrar un service worker generado en build que precachea los assets estáticos de la SPA (cáscara offline) y permite detectar nuevas versiones del bundle.
- Añadir detección de actualizaciones: cuando el service worker encuentre un nuevo build, mostrar un botón flotante "Nueva actualización disponible"; al pulsarlo, recargar la aplicación con la versión nueva (skipWaiting + reload).
- Mantener el aviso de actualización y las notificaciones WebSocket (socket.io) funcionando de forma no conflictiva con el service worker (el socket no debe cachearse).
- Asegurar que la configuración de Vite dev/prod genere el manifest, el service worker y los iconos únicamente en producción (sin interferir en `npm run dev`).

## Capabilities

### New Capabilities

- `pwa-installability`: Manifest de aplicación web, iconos en múltiples tamaños/formatos, metadatos de instalación y service worker de precache que hacen la SPA instalable y con cáscara offline.
- `pwa-update-notification`: Detección de nuevas versiones del bundle vía service worker y botón flotante para actualizar la aplicación al instante (skipWaiting + reload), con estado persistente no intrusivo.

### Modified Capabilities

- `screen-flow`: La entrada de la aplicación debe incorporar el flujo de instalación PWA y el banner de nueva actualización disponible como overlay global, sin romper la navegación existente ni el login B2B.

## Impact

- `apps/client/package.json`: nueva dependencia `vite-plugin-pwa` (devDependency) y scripts de build sin cambios.
- `apps/client/vite.config.ts`: añadir `VitePWA` con `registerType: 'prompt'`, manifest, iconos y estrategias de cache.
- `apps/client/index.html`: meta tags PWA, links a manifest e iconos.
- `apps/client/public/`: iconos `*.png` (192, 512, maskable, apple-touch-icon) y `*.svg`.
- `apps/client/src/`: hook `usePwaInstallPrompt`, hook `usePwaUpdate` y componente `PwaUpdateBanner` (o `PwaInstallButton`), montado en `App.tsx` respetando las rutas `/dt` y `/canchas`.
- No afecta al backend NestJS ni a la base de datos. No se cachean peticiones de API.