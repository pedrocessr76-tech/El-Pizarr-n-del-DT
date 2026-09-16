## ADDED Requirements

### Requirement: Entrada PWA y aviso de actualización en la navegación global
El flujo de pantallas MUST incorporar de forma global, sin bloquear la navegación existente: (1) un botón/flujo de instalación PWA cuando el navegador lo permita (`beforeinstallprompt`) y (2) un aviso flotante de "Nueva actualización disponible" con acción "Actualizar ahora". Ambos overlays MUST renderizarse tanto en la ruta del juego (`/dt`) como en Sistema Canchas (`/canchas`).

#### Scenario: Instalar la aplicación desde la Home
- **WHEN** el usuario está en la Home del juego y el navegador soporta instalación
- **THEN** se muestra el botón de instalación y al presionarlo se abre el prompt nativo.
- **AND WHEN** el usuario instala
- **THEN** el botón de instalación deja de mostrarse.

#### Scenario: Actualizar sin perder la ruta
- **WHEN** el usuario está en cualquier pantalla (juego o `/canchas`) y existe una nueva versión
- **THEN** el aviso flotante permite "Actualizar ahora" sin navegar al usuario fuera de su ruta actual.
- **AND WHEN** el usuario confirma la actualización
- **THEN** la app se recarga en la última versión manteniendo la misma ruta.