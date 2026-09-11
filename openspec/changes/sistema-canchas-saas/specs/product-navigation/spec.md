## ADDED Requirements

### Requirement: Selector de productos
El sistema SHALL mostrar en la aplicación/experiencia diferenciada de Sistema Canchas un enlace claro y accesible hacia El Pizarrón del DT, sin compartir estado de negocio ni asumir una base de datos común.

#### Scenario: Ir al juego
- **WHEN** el usuario activa el enlace de El Pizarrón del DT
- **THEN** navega a la ruta del juego sin perder una sesión compartida válida

#### Scenario: Regresar al sistema de canchas
- **WHEN** el usuario activa Sistema Canchas desde el shell del juego
- **THEN** vuelve al dashboard o a la pantalla B2B inicial según su contexto