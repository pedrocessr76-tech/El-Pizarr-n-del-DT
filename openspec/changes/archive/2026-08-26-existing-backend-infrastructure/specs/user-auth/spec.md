## ADDED Requirements

### Requirement: Registro de usuario
El sistema MUST permitir crear una cuenta con `username` y `password`, hasheando la contraseña con bcrypt y devolviendo un `<accessToken>` JWT vía `POST /auth/register`.

#### Scenario: Registrar una cuenta nueva
- **WHEN** un usuario envía sus credenciales a `/auth/register`
- **THEN** el sistema crea el usuario en la DB, hashea la contraseña y devuelve el JWT.

### Requirement: Inicio de sesión con JWT
El sistema MUST autenticar usuarios con `username` + `password` y devolver un JWT con expiración de 7 días vía `POST /auth/login`.

#### Scenario: Login exitoso
- **WHEN** las credenciales son válidas
- **THEN** el sistema devuelve un `accessToken` (7 días).
#### Scenario: Login fallido
- **WHEN** las credenciales son incorrectas
- **THEN** el sistema responde 401 Unauthorized.

### Requirement: Perfil de usuario protegido
El sistema MUST exponer `GET /auth/profile` protegido por guard JWT que devuelve `id`, `username` y `createdAt`.

#### Scenario: Obtener el perfil autenticado
- **WHEN** un usuario envía un JWT válido en el header `Authorization`
- **THEN** el sistema devuelve los datos del perfil.

### Requirement: Login/Registro en overlay (Frontend)
El frontend MUST ofrecer el acceso desde un overlay modal (`LoginModal`) con toggle entre iniciar sesión y registrarse, validación de campos (usuario ≥ 3 caracteres y contraseña ≥ 6, confirmación de contraseña) y mensajes de error.

#### Scenario: Abrir el overlay de acceso desde Home/Navbar
- **WHEN** el usuario presiona "Iniciar Sesión"
- **THEN** se abre el overlay con los formularios y validaciones correspondientes.

#### Scenario: Iniciar sesión correctamente
- **WHEN** el usuario envía credenciales válidas en el overlay
- **THEN** se cierra el overlay, se guarda el token y el usuario queda autenticado en la Home.