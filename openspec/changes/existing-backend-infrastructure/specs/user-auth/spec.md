## ADDED Requirements

### Requirement: Registro de usuario
El sistema DEBE permitir a los usuarios crear una cuenta con username y password, hasheando con bcrypt y devolviendo JWT.

#### Scenario: Registrar nueva cuenta
- **WHEN** un usuario completa el formulario de registro
- **THEN** el sistema crea el usuario en la DB, hashea la contraseña con bcrypt y devuelve un token JWT

### Requirement: Inicio de sesión con JWT
El sistema DEBE autenticar mediante username + password y devolver un token JWT con expiración de 7 días.

#### Scenario: Login exitoso
- **WHEN** un usuario ingresa username y password correctos
- **THEN** el sistema valida las credenciales contra la DB y devuelve un accessToken JWT

#### Scenario: Login fallido
- **WHEN** un usuario ingresa credenciales incorrectas
- **THEN** el sistema devuelve error 401 Unauthorized

### Requirement: Perfil de usuario protegido
El sistema DEBE exponer un endpoint GET /auth/profile protegido por JWT que devuelva id, username y createdAt.

#### Scenario: Obtener perfil autenticado
- **WHEN** un usuario envía un token JWT válido en el header Authorization
- **THEN** el sistema devuelve los datos del perfil del usuario autenticado

### Requirement: Pantalla de Login (Frontend) — PENDIENTE
El sistema DEBE presentar una interfaz de login con campos de username, password, botón "Iniciar Sesión", toggle a registro, validaciones, mensajes de error y loading.

#### Scenario: Interfaz de ingreso
- **WHEN** el usuario abre la aplicación sin sesión activa
- **THEN** el sistema DEBE mostrar el formulario de login con todos los elementos especificados

#### Scenario: Validación de entrada
- **WHEN** el usuario intenta enviar el formulario con datos inválidos
- **THEN** el sistema DEBE mostrar mensajes de error claros
