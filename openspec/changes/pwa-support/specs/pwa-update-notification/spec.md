## ADDED Requirements

### Requirement: Detección de nueva versión
El sistema MUST detectar cuando existe una nueva versión del bundle publicada en el servidor tras un despliegue. El service worker MUST usar `registerType: 'prompt'` y el frontend MUST escuchar el evento `updatefound`/`statechange` del service worker, así como `registration.update()` periódico (cada ~1 hora) para descubrir versiones nuevas sin recargar.

#### Scenario: Nueva versión detectada en background
- **WHEN** se publica una nueva versión y el usuario tiene la app abierta
- **THEN** el service worker descarga el nuevo bundle en background y emite la señal de "nueva versión disponible".

#### Scenario: Recarga con versión nueva
- **WHEN** el usuario presiona "Actualizar ahora"
- **THEN** se llama `skipWaiting` al service worker en espera, se descargan los nuevos assets, se recarga la página y la app queda en la última versión.

### Requirement: Aviso de actualización disponible
El sistema MUST mostrar un aviso visual (banner o botón flotante) con el texto "Nueva actualización disponible" con una acción "Actualizar ahora" cuando se detecta la nueva versión, sin interrumpir el flujo actual del usuario. El aviso MUST ser utilizable en las rutas del juego (`/dt`) y de Sistema Canchas (`/canchas`).

#### Scenario: Aviso aparece sin bloquear
- **WHEN** el usuario navegando recibe señal de nueva versión
- **THEN** aparece un botón flotante no intrusivo que permite "Actualizar ahora" o ignorar.

#### Scenario: Ignorar aviso
- **WHEN** el usuario ignora el aviso
- **THEN** la app sigue funcionando en la versión actual y el aviso puede reaparecer en la próxima señal de actualización si la versión sigue distinta.

#### Scenario: Aviso en ruta B2B
- **WHEN** el usuario está en `/canchas` (Sistema Canchas)
- **THEN** el aviso de actualización se renderiza igualmente sin romper el shell B2B.

### Requirement: No interferencia con notificaciones en vivo
El aviso de actualización MUST coexistir con el sistema de notificaciones WebSocket (toasts y campana) y no cachear conexiones `/socket.io`; un recargo tras actualizar MUST restaurar la sesión (JWT/localStorage) y reconectar el socket automáticamente.

#### Scenario: Toasts y usuario preservados tras actualizar
- **WHEN** el usuario actualiza a la nueva versión desde el aviso
- **THEN** la sesión, los datos de draft/equipo en localStorage y el estado de la app se preservan y el socket se reconecta.