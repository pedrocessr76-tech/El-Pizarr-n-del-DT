# Email Verification Spec

## ADDED Requirements

### Requirement: Registro con email y contraseña exige verificación obligatoria
El sistema MUST crear cuentas con `emailVerified = false` al registrarse con email+contraseña. El sistema MUST enviar un email de verificación con un token único y de un solo uso antes de permitir cualquier login activo. El login MUST NOT tener éxito mientras `emailVerified` sea `false`, y MUST ofrecer un mecanismo para reenviar el email de verificación.

#### Scenario: Registro exitoso genera token y pide verificación
- When un usuario se registra con email+contraseña válidos
- Then la cuenta se crea con emailVerified = false
- And se genera un token de verificación (criptográficamente aleatorio, hash almacenado, expiración ≤ 30 min, single-use)
- And se envía un email de verificación a esa dirección
- And no se retorna un access token de sesión activa como "logueado" hasta que verifique

#### Scenario: Login bloqueado mientras no verificado
- When un usuario intenta login con email+contraseña y emailVerified = false
- Then el sistema rechaza el intento con un error claro indicando que debe verificar su email
- And la respuesta incluye una indicación para reenviar verificación (sin revelar si el email existe)

#### Scenario: Reenvío de verificación
- When solicita reenviar verificación con email válido
- Then se invalida cualquier token pendiente previo (rotación) y se emite uno nuevo con expiración renovada
- And se envía el nuevo email (respuesta genérica para evitar user enumeration)

### Requirement: Verificación de token confirma email
El sistema MUST proveer un endpoint para verificar el token de verificación. Al confirmar exitosamente, MUST marcar `emailVerified = true`, invalidar el token (usado) y permitir login a partir de ese momento.

#### Scenario: Verificación exitosa
- When presenta un token válido, no usado y no expirado
- Then emailVerified pasa a true
- And el token queda marcado como usado
- And se puede iniciar sesión inmediatamente

#### Scenario: Token expirado o usado
- When presenta token expirado o ya usado
- Then rechaza con error claro y ofrece reenviar verificación

#### Scenario: Token inválido
- When presenta token inexistente o corrupto
- Then rechaza con error genérico (sin revelar detalles)

### Requirement: OAuth exige email verificado
Al autenticar con proveedores OAuth (Google, Apple, Microsoft), el sistema MUST exigir que el proveedor declare `email_verified === true`. Si el claim indica `false`, está ausente o no es confiable para ese proveedor, el sistema MUST NOT crear sesión activa: MUST generar un token de verificación para esa dirección y solicitar al usuario que verifique su email antes de ingresar.

#### Scenario: OAuth con email verificado
- When OAuth devuelve email con email_verified = true
- Then el sistema crea/actualiza usuario con emailVerified = true (o mantiene) y permite login

#### Scenario: OAuth con email NO verificado
- When OAuth devuelve email con email_verified = false o ausente
- Then NO crea sesión activa
- And envía email de verificación a esa dirección con token válido
- And responde indicando que debe verificar su email para continuar (flujo de verificación obligatorio)

### Requirement: Protección anti-tempmail configurable
El sistema MUST soportar bloqueo de dominios de email desechables (tempmail). Por defecto MUST tener una lista mínima, y MUST poder configurarse por entorno (habilitado/deshabilitado). La respuesta al intento con dominio bloqueado MUST ser genérica (no listar dominios) para evitar enumeración.

#### Scenario: Dominio desechable bloqueado
- When intenta registrarse con dominio tempmail bloqueado
- Then rechaza registro con mensaje genérico sugiriendo usar email válido
- And no envía email de verificación

### Requirement: Seguridad y entrega de emails de verificación
Los tokens MUST almacenarse con hash (nunca en texto plano), tener expiración ≤ 30 minutos, ser de un solo uso y rotarse al reenviar. Los emails de verificación MUST enviarse por el proveedor de email configurado (reutilizando SMTP de #34: cae a `log` si no hay configuración). El enlace MUST aceptar token por URL o por body.

#### Scenario: Token almacenado con hash
- When se genera token
- Then solo su hash (p.ej. SHA-256) se persiste en BD; el token original solo viaja por email

#### Scenario: Rotación al reenviar
- When reenvía verificación
- Then tokens anteriores pendientes quedan invalidados
- And solo el nuevo token es válido

#### Scenario: Entrega degrada a simulado sin SMTP
- When no hay configuración SMTP
- Then el email se registra como simulado (provider log) y el sistema aún permite el flujo (ideal para desarrollo), indicando modo simulado en logs
