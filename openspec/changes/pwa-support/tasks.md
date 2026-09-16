## 1. Setup y configuración

- [x] 1.1 Instalar `vite-plugin-pwa` como devDependency en `apps/client`.
- [x] 1.2 Configurar `vite.config.ts`: plugin `VitePWA` con `registerType: 'prompt'`, `injectRegister: false`, `devOptions.enabled: false`, `manifest` completo y `workbox` (precache globPatterns, `navigateFallback: '/index.html'`, `navigateFallbackDenylist` para `/api`, `/socket.io`, `/docs`, `/auth`, `/draft`, `/match`).
- [x] 1.3 Generar y commitear iconos en `apps/client/public/`: `pwa-192x192.png`, `pwa-512x512.png`, `pwa-512x512-maskable.png`, `apple-touch-icon.png` (180) y `favicon.svg` (script Node sin dependencias en `apps/client/scripts/generate-pwa-icons.mjs`).
- [x] 1.4 Añadir metadatos PWA en `index.html`: `<link rel="manifest">`, `theme-color`, `apple-touch-icon`, `favicon.svg` y descripción.

## 2. Detección de actualización (service worker)

- [x] 2.1 Crear `src/hooks/usePwaRegistration.ts` usando `virtual:pwa-register/register` (`immediate: true`) que exponga `needRefresh`, `offlineReady`, `updateSW()` y chequeo periódico (`registration.update()` ~1 h).
- [x] 2.2 Manejar `beforeinstallprompt` en el hook: guardar el evento, exponer `canInstall` y `promptInstall()`, y respetar la elección previa con `localStorage`.
- [x] 2.3 Crear `src/components/pwa/PwaUpdateBanner.tsx`: botón flotante "Nueva actualización disponible → Actualizar ahora" (bottom-right, aria-live) que ejecuta `updateSW()` (skipWaiting + reload).
- [x] 2.4 Crear `src/components/pwa/PwaInstallButton.tsx`: botón "Instalar aplicación" visible solo cuando `canInstall`, oculto tras instalar/descartar.
- [x] 2.5 Montar banner y botón en `App.tsx` (juego) y dentro de `B2bApp` (`/canchas`) sin duplicar la escucha del service worker y sin romper la ruta actual.

## 3. Verificación

- [x] 3.1 Ejecutar `npm run build --workspace=client` y verificar en `dist/`: `sw.js`, `manifest.webmanifest`, iconos y `registerSW.js`.
- [x] 3.2 Probar instalabilidad en HTTPS/localhost (Chrome DevTools → Application → Manifest/Service Worker): instalar la app y volver a abrirla.
- [x] 3.3 Probar flujo de actualización: hacer dos builds con un cambio de asset y confirmar que el banner de "nueva actualización" aparece y que "Actualizar ahora" carga la versión nueva conservando sesión y ruta.
- [x] 3.4 Probar la cáscara offline (recargar con red desactivada) y verificar que las peticiones `/api` y `/socket.io` no son cacheadas.
- [x] 3.5 Ejecutar typecheck/build completos del repo y validar `openspec validate` del change.