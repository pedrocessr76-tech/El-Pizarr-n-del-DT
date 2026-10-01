## 1. Modelo de datos

- [x] 1.1 Agregar `emailVerified: boolean` (default false) a la entidad de usuario B2B + migración.
- [x] 1.2 Crear entidad `EmailVerificationToken` con `userId`, `tokenHash`, `expiresAt`, `usedAt`, `attempts` + migración.
- [x] 1.3 Crear índices: único en `tokenHash`, `userId + usedAt` para consultas de reenvío.
- [x] 1.4 Política de migración de usuarios existentes: definir si se fuerza verificación en próximo login o grace period.

## 2. Servicio de verificación

- [x] 2.1 Crear `EmailVerificationService` con: generación de token (randomBytes/UUID v4), hash SHA-256 para persistir, expiración 30 min.
- [x] 2.2 Método `issueToken(userId)`: invalida tokens pendientes previos, crea nuevo, retorna token original (solo en memoria para el email).
- [x] 2.3 Método `verifyToken(token)`: valida hash, expiración, `usedAt`; marca usado si OK; retorna usuario o error.
- [x] 2.4 Guardar solo el hash del token (nunca en texto plano en BD).

## 3. Endpoints

- [x] 3.1 `POST /api/v1/auth/verify-email` con token (por body o query). Marca `emailVerified = true`, invalida token.
- [x] 3.2 `POST /api/v1/auth/resend-verification` con email. Rota tokens, envía nuevo. Respuesta genérica anti-enumeración.
- [x] 3.3 Mensajes de error claros para: expirado, usado, inválido, reenviado.

## 4. Integración con registro/login tradicional

- [x] 4.1 Registro: crear usuario con `emailVerified = false`, generar token, enviar email de verificación.
- [x] 4.2 Login: rechazar con `emailVerified = false` indicando que verifique; no revelar si el email existe.
- [x] 4.3 Usar `MessagingService.sendEmail()` (de #34) para enviar el email de verificación; degradar a `log` sin SMTP.
- [x] 4.4 Plantilla de email de verificación con enlace a `{B2B_PUBLIC_URL}/canchas/verificar-email?token=...` (base URL desde env).

## 5. Bloqueo de dominios tempmail

- [x] 5.1 Crear `DisposableEmailService` con lista de dominios (configurable por env, lista mínima por defecto).
- [x] 5.2 Rechazar registro/login con dominio bloqueado, mensaje genérico sin revelar la lista.
- [x] 5.3 Documentar variable de entorno para personalizar/agregar dominios.

## 6. Pruebas

- [x] 6.1 Tests de registro: crea con `emailVerified = false`, genera token, no da sesión activa.
- [x] 6.2 Tests de login: rechaza si no verificado, acepta si verificado.
- [x] 6.3 Tests de verificación: éxito, expirado, usado, inválido.
- [x] 6.4 Tests de reenvío: rota tokens, respuesta genérica.
- [x] 6.5 Tests de tempmail: rechaza dominio bloqueado, no revela lista.
- [ ] 6.6 Tests de OAuth (cuando exista): rechaza `email_verified = false`.

## 7. Frontend B2B

- [x] 7.1 Pantalla/modal "Verificá tu email" tras registro exitoso, con opción de reenviar.
- [x] 7.2 Pantalla de confirmación de token (éxito, error, expirado) en ruta `/canchas/verificar-email`.
- [x] 7.3 Mensaje de error de login con acción directa a "Reenviar verificación".
- [x] 7.4 Tests de los componentes nuevos.

## 8. Documentación y despliegue

- [x] 8.1 Documentar flujo de verificación, variables SMTP, entrega de emails, política de tokens.
- [x] 8.2 Documentar política de migración de usuarios existentes.
- [x] 8.3 Correr build, typecheck, tests de servidor y cliente.
- [x] 8.4 Validar OpenSpec.
