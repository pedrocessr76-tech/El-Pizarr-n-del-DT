## Context

`apps/client` es una SPA React 18 + Vite 5 + Tailwind 4 servida como sitio estático en Render (`el-pizarron-web`, `staticPublishPath: apps/client/dist`, con rewrite `/* → /index.html`). Comparte origen con la API (Render `el-pizarron-api`), que responde bajo `/api`, `/draft`, `/match`, `/auth`, `/socket.io`, `/docs`. La app tiene dos frentes en el mismo SPA: el juego (ruta raíz `/`) y Sistema Canchas (`/canchas`, B2B). No existe hoy ningún manifest, service worker ni iconos.

El objetivo es convertir la SPA en una PWA instalable (manifest + iconos + service worker con cáscara offline) y añadir un aviso de "nueva actualización disponible" con botón que recarga con la última versión, sin romper la navegación actual ni el shell B2B.

## Goals / Non-Goals

**Goals:**

- Convertir la app en PWA instalable desde Chrome/Edge/Móvil (manifest válido, iconos 192/512/maskable/apple-touch, service worker con precache).
- Detectar nuevas versiones del bundle tras cada despliegue y ofrecer un botón flotante "Nueva actualización disponible → Actualizar ahora" que aplica `skipWaiting` + recarga.
- Mantener la cáscara de la app funcional offline y NO cachear nunca peticiones de API ni sockets.
- Hacerlo robusto en el entorno de Render (sitio estático, raíz compartida juego+B2B).

**Non-Goals:**

- No implementar push notifications del sistema operativo (Web Push) en este incremento.
- No migrar a RSC/SSR ni cambiar la arquitectura de build actual.
- No añadir nuevas dependencias de sistema de iconos (se generan los PNG con un script Node sin librerías externas; SVG de favicon se escribe a mano).
- No tocar el backend NestJS ni la base de datos.

## Decisions

### 1. `vite-plugin-pwa` (workbox `generateSW`) con `registerType: 'prompt'`
Se usa `vite-plugin-pwa` porque integra con Vite 5, genera `manifest.webmanifest`, precachea el bundle con hashes de Vite y expone el cliente `virtual:pwa-register/register` con callbacks `onNeedRefresh`/`onOfflineReady`. Alternativa descartada: service worker a mano — duplicaría la lógica de hashing de assets y la gestión de iteración de caché que workbox resuelve probado.

- `registerType: 'prompt'` (no `autoUpdate`): el navegador mantiene el SW nuevo como "waiting" y el frontend decide cuándo aplicar `skipWaiting`. Esto es lo que habilita el botón "Actualizar ahora". Con `autoUpdate` se aplicaría solo y en silencio, sin feedback al usuario.
- `injectRegister: false` y control directo vía `virtual:pwa-register/register` con `immediate: true` para registrar el SW en el primer load y vigilar `updatefound` + `registration.update()` periódico (~1 h) mediante `interval` propio.

### 2. Configuración de workbox / caché
- `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg}']` → precache de assets con hashes de Vite (los nombres cambian por build, así el manifest del precache cambia y se **detecta la actualización**).
- `navigateFallback: '/index.html'` con `navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/, /^\/docs/, /^\/auth/, /^\/draft/, /^\/match/]` → navegación SPA offline, sin tocar API.
- Sin runtime caching de peticiones de red a la API (solo precache). Las imágenes públicas (`/images/*.jpg`) sí se precachean (están listadas en globPatterns).
- `maximumFileSizeToCacheInBytes` ampliado (SPA >2MB de assets).
- `serviceWorker.registerType: 'prompt'`, `devOptions.enabled: false` → en `npm run dev` no se registra SW ni se interpone el manifest (sin interferencias en desarrollo).

### 3. Iconos generados por script y commiteados
- `apps/client/scripts/generate-pwa-icons.mjs`: genera con Node built-in (`zlib` + codificación PNG manual en crudo) los PNG `pwa-192x192.png`, `pwa-512x512.png`, `pwa-512x512-maskable.png` y `apple-touch-icon.png` (180). Diseño: fondo `#0b1326`, tablero/balón en acento verde `#15803d` + trazo claro, coherente con la identidad actual. `favicon.svg` se escribe a mano (vector).
- Se commitean en `apps/client/public/` (Render sirve `dist/` estático; los archivos de `public/` se copian a `dist/` en build).
- Alternativa descartada: `vite-plugin-pwa-assets` (PNG desde SVG) — añade dependencia y toolchain; el script sin deps es más simple y reproducido.

### 4. Componentes y estela de estado
- `src/hooks/usePwaRegistration.ts`: hook singleton que usa `virtual:pwa-register/register`, expone `needRefresh: boolean`, `offlineReady`, `updateSW()` y manejo de `beforeinstallprompt` (guarda el evento, devuelve `canInstall` y `promptInstall()` respetando instalación/cierre previo vía `localStorage`).
- `src/components/pwa/PwaUpdateBanner.tsx`: botón flotante (bottom-right, por encima de toasts) "Nueva actualización disponible → Actualizar ahora", estilo coherente con `PwaUpdateBanner`/toasts existentes y accesible (aria-live).
- `src/components/pwa/PwaInstallButton.tsx`: botón "Instalar aplicación" visible solo cuando `canInstall` está activo; se oculta tras instalar o descartar.
- `src/components/pwa/PwaOverlays.tsx`: agrupa `PwaUpdateBanner` + `PwaInstallButton` y se monta **una sola vez** en la raíz de `App` (wrapper con fragment), en ambas ramas de ruta: la del juego y la del early-return de `B2bApp` (`/canchas`). Así el hook `usePwaRegistration` corre una única vez por página y no se duplican los listeners del service worker ni las llamadas a `registerSW`.
- No usar store global Zustand para esto: estado efímero de 1 despliegue; basta el hook + estado local del componente.

### 5. Integración con notificaciones en vivo (socket.io)
El SW no cachea `socket.io` (denylist + ausencia de runtime caching). El recargo tras "Actualizar ahora" preserva `localStorage` (JWT, draft, guest session, `b2bToken`) y `useNotificationSocket()` se remonta automáticamente por `App.tsx`. No hay interacción bloqueante entre el banner y los toasts (zonas opuestas: banner bottom-right, toasts top-right).

## Risks / Trade-offs

- [Riesgo] Usuario con versión vieja en caché y una token/Auth cambiados → Mitigación: assets con hash de Vite (cambian por build) + detección de actualización; la sesión se conserva en localStorage; cualquier 401 fuerza re-login normal.
- [Riesgo] Servir HTML/`index.html` cacheado con referencias a assets viejos → Mitigación: `navigateFallback` sin cache del HTML en tiempo de ejecución (precache versionado) y `skipWaiting` al actualizar; el banner garantiza paso a la versión nueva.
- [Riesgo] Render: `/* → /index.html` y SW con scope `/` → cobertura completa del origen OK; el manifest usa `start_url: '/'` y rutas relativas para servir desde el subpath del sitio estático.
- [Riesgo] Añadir PNG con codificación manual propenso a error → Mitigación: script con salida verificada (tamaño de bytes, dimensiones en header PNG) y validación en CI/status; fallback a SVG+favicon si falla la generación.
- [Riesgo] `beforeinstallprompt` no se dispara en todos los navegadores (iOS Safari no lo soporta) → Mitigación: es mejora progresiva; el acceso vía menú del navegador sigue disponible; el botón simplemente no aparece.

## Migration Plan

1. Instalar `vite-plugin-pwa` (devDependency) y configurar `vite.config.ts` (manifest, workbox, denylist).
2. Generar iconos con el script y commitearlos bajo `apps/client/public/`.
3. Añadir meta tags de PWA en `index.html` (manifest, theme-color, apple-touch-icon, favicon).
4. Crear hook + componentes (`usePwaRegistration`, `PwaUpdateBanner`, `PwaInstallButton`) y montarlos en `App.tsx` y `B2bApp`.
5. Verificar: build de producción, archivos en `dist/` (`sw.js`, `manifest.webmanifest`, icons), Instalación en localhost/HTTPS y flujo de update con deploy simulado (cambiar un asset entre dos builds y comprobar el banner).
6. Rollback: si un deploy rompe, se vuelve a desplegar la versión anterior; el SW detecta el cambio y ofrece actualizar (o se recarga con la versión vieja) sin daño a la base de datos (el backend no cambia).