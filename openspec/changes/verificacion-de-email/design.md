## Context

Este cambio implementa verificación obligatoria de email, alineada con la issue de login con cuentas Google/OAuth (#pendiente). El objetivo es asegurar que la dirección de email exista y esté controlada por el propietario ANTES de conceder acceso al sistema, tanto para registros tradicionales como para OAuth.

Decisiones clave:
- **Bloqueo duro en registro tradicional:** `emailVerified = false` inicial, login bloqueado hasta confirmar.
- **OAuth estricto pero no bloqueante:** si `email_verified !== true`, se cae a un flujo de verificación por email (no se rechaza silenciosamente, se envía token).
- **Token seguro:** aleatorio criptográficamente fuerte, almacenado con hash (SHA-256), expiración 30 min, single-use, rotado al reenviar.
- **Anti-user-enumeration:** respuestas genéricas en login/registro/reenvío.
- **Anti-tempmail:** lista configurable de dominios desechables.
- **Infraestructura de email:** reutilizar el `MessagingService.sendEmail()` y el `SmtpMessageProvider` de #34 (con fallback a `log`).

## Goals / Non-Goals

**Goals:**
- Asegurar que todo usuario (registro tradicional u OAuth) verifica su email antes de obtener acceso activo.
- Usar el canal de email ya implementado (SMTP + fallback log) para enviar tokens.
- Proveer endpoints claros: `POST /auth/resend-verification`, `POST /auth/verify-email`.
- Integrar OAuth exigiendo `email_verified === true` como condición necesaria.
- Incluir protección básica contra emails desechables (tempmail).

**Non-Goals:**
- Implementar el login OAuth en sí (eso es otro change/issue). Este change define el contrato de verificación que OAuth debe cumplir.
- Autenticación multifactor (MFA/2FA).
- Recuperación de cuenta por email (puede ser futuro).

## Decisions

### D1: Campo `emailVerified` en entidad de usuario B2B
- Migración no destructiva: agregar columna boolean con default false. Para usuarios staff existentes que operen en producción, considerar forzar verificación en próximo login.

### D2: Tabla de tokens de verificación
- Crear entidad `EmailVerificationToken` con: `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`, `attempts` (para limitar fuerza bruta).
- Índice único en `tokenHash`, índice en `(userId, usedAt)`.

### D3: Flujo de reenvío con rotación
- Al pedir reenvío, eliminar/invalidate todos los tokens pendientes del usuario antes de crear uno nuevo. Esto previene que un atacante con un token viejo pueda usarlo.

### D4: OAuth con `email_verified = false` → flujo de verificación
- No crear sesión activa. Enviar token de verificación. El usuario confirma y luego reintenta el login OAuth (o accede por el enlace de verificación, que internamente autentica si corresponde).

### D5: Lista de dominios tempmail configurable
- Variable de entorno con lista separada por comas, o archivo de configuración. Por defecto, lista mínima hardcodeada en el servicio.

### D6: Reutilizar infraestructura de email de #34
- `MessagingService.sendEmail(to, body, subject, 'email-verification', context)`. Degrada a `log` sin SMTP, útil para desarrollo.

### D7: Mensajes genéricos anti-enumeración
- Login, registro y reenvío usan respuestas genéricas: "Si esa cuenta existe, te enviamos un email de verificación".

## Risks / Trade-offs

- **Fricción de UX:** nuevo paso obligatorio. Mitigación: onboarding claro, reenvío en un click, mensaje de guía "Revisa tu spam".
- **OAuth que no reportan `email_verified`:** algunos proveedores antiguos pueden no incluirlo. Decisión: solo bloquear cuando explícitamente `false` o ausente, y ofrecer flujo de verificación.
- **Migración de usuarios existentes:** `emailVerified` inicia en false. Para staff existente, se puede optar por un grace period o forzar verificación en próximo login (decisión de negocio).
- **Deliverability:** emails de verificación necesitan SPF/DKIM del dominio remitente (depende del mailbox SMTP configurado en #34).

## Migration Plan

1. Agregar columna `emailVerified` (boolean, default false) a entidad de usuarios.
2. Crear tabla de tokens de verificación.
3. Actualizar flujo de registro tradicional: `emailVerified = false` + envío de token.
4. Actualizar flujo de login: rechazar si `emailVerified = false`.
5. Crear endpoints de reenvío y verificación.
6. (OAuth, en change separado) Integrar validación de `email_verified`.
7. Documentar en `docs/RENDER_B2B.md` cómo verificar emails y qué hacer con usuarios existentes.
