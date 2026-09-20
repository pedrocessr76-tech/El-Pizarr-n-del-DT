## ADDED Requirements

### Requirement: Registro público solo de clientes
El sistema SHALL permitir crear cuentas por registro público únicamente con el rol `CLIENT`. No SHALL existir un endpoint público que cree organizaciones nuevas ni cuentas con roles de staff (`OWNER`/`ADMIN`/`OPERATOR`). Las cuentas de administrador y dueño de cancha SHALL crearse únicamente mediante código interno (seed/script de mantenimiento).

#### Scenario: Registro de cliente usuario
- **WHEN** un visitante registra email, nombre completo y contraseña
- **THEN** el sistema crea una cuenta `CLIENT` en una organización activa y emite un JWT con el rol `CLIENT`

#### Scenario: Registro de staff por API pública rechazado
- **WHEN** una solicitud intenta crear una organización o una cuenta con rol `OWNER`/`ADMIN`/`OPERATOR` a través de la API pública de registro
- **THEN** la API rechaza la operación y no crea ningún registro

#### Scenario: Alta de staff por código
- **WHEN** se ejecuta el seed o un script de mantenimiento
- **THEN** el sistema crea las cuentas de staff (`OWNER`/`ADMIN`) por código en la organización correspondiente

### Requirement: Detección de rol al iniciar sesión
El sistema SHALL identificar el rol real del usuario al iniciar sesión y la aplicación SHALL rutear la navegación según ese rol, sin solicitar selección manual de perfil ni en el login ni en el registro.

#### Scenario: Cliente inicia sesión
- **WHEN** inicia sesión una cuenta con rol `CLIENT`
- **THEN** la aplicación redirige al portal de reservas
- **AND** las vistas de gestión del staff no se muestran

#### Scenario: Staff inicia sesión
- **WHEN** inicia sesión una cuenta con rol `OWNER`/`ADMIN`/`OPERATOR`
- **THEN** la aplicación redirige al dashboard de gestión
- **AND** conserva las funcionalidades de administrador y dueño de cancha

#### Scenario: Sin selector de rol
- **WHEN** se presenta el formulario de login o registro
- **THEN** no se muestra un selector de rol
- **AND** la decisión de navegación se basa únicamente en los roles autenticados