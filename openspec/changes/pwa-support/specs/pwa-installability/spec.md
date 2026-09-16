## ADDED Requirements

### Requirement: Manifest de aplicación web
El sistema MUST exponer un manifest de aplicación web (`manifest.webmanifest`) en `/` con campos `name`, `short_name`, `description`, `start_url`, `display` (standalone), `theme_color`, `background_color`, `icons` (192 y 512, incluido `maskable`) y `lang` es-AR. El `index.html` MUST enlazar el manifest y declarar `theme-color`.

#### Scenario: Manifest disponible y enlazado
- **WHEN** el usuario abre la app instalada o inspecciona `/manifest.webmanifest`
- **THEN** el manifest se sirve con todos los campos requeridos y el `index.html` incluye `<link rel="manifest">`.

#### Scenario: Cumple criterios de instalación
- **WHEN** un navegador compatible (Chrome/Edge/Android) evalúa la instalabilidad
- **THEN** muestra el prompt de "Instalar aplicación" porque hay manifest + icono ≥ 192px + service worker con precache.

### Requirement: Iconos de la aplicación
El sistema MUST incluir iconos en `public/`: `pwa-192x192.png`, `pwa-512x512.png`, `pwa-512x512-maskable.png` y `apple-touch-icon.png` (180px), con el marcado visual del producto (fondo `#0b1326` y acento del pizarrón) y un `favicon.svg` referenciado en `index.html`.

#### Scenario: Iconos servidos y referenciados
- **WHEN** se realiza el build de producción
- **THEN** los iconos se copian a `dist/` y el manifest más el `index.html` los referencian correctamente.

#### Scenario: Apple touch icon
- **WHEN** un iPhone agrega la app al home
- **THEN** usa `apple-touch-icon.png` de 180px declarado en `index.html`.

### Requirement: Service worker con precache de la SPA
El sistema MUST registrar un service worker en producción que precachee los assets del bundle (cáscara de aplicación) y devuelva desde cache las peticiones de assets estáticos; MUST NO cachear peticiones de API (`/api`, `/draft`, `/match`, `/auth`, `/socket.io`).

#### Scenario: Instalación del service worker
- **WHEN** el usuario carga la app en producción y el service worker no existe
- **THEN** se registra, precachea los assets y la app queda disponible offline para su cáscara.

#### Scenario: Navegación offline
- **WHEN** el usuario está sin conexión y recarga la ruta raíz
- **THEN** se sirve la cáscara precacheada y la app inicia mostrando el estado offline sin crash.

#### Scenario: API no cacheada
- **WHEN** el frontend llama a endpoints de API o usos socket.io
- **THEN** las peticiones no se atienden desde cache y no se cachean respuestas de API.

### Requirement: Prompt de instalación controlado
El sistema MUST exponer un hook/flag que, cuando el navegador dispara `beforeinstallprompt`, permita mostrar un botón "Instalar aplicación" de forma opcional y no automática; MUST respetar elección previa del usuario (una sola vez o cancelable).

#### Scenario: Prompt disponible
- **WHEN** el navegador dispara `beforeinstallprompt` y el usuario aún no lo vio
- **THEN** el botón "Instalar aplicación" aparece en el header o Home.
- **AND WHEN** el usuario lo presiona
- **THEN** se muestra el prompt nativo de instalación del navegador.
- **AND WHEN** el usuario instala o descarta
- **THEN** el flag se guarda para no volver a mostrar el botón en esa sesión/navegador.