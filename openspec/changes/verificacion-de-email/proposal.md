## Why
- El login con OAuth (Google, Apple, Microsoft) puede devolver emails no verificados. No debemos confiar ciegamente en ese campo: un atacante podría controlar un dominio o el proveedor podría entregar un email sin marcar como verificado.
- Para registro con email+contraseña, hoy el usuario queda activo inmediatamente. Es común que se registren con emails erróneos o temporales (tempmail), lo que dificulta soporte, recuperación de cuenta y cumplimiento de comunicaciones transaccionales.
- La verificación de email es el control mínimo para asegurar que la dirección existe y que el propietario la controla antes de otorgar acceso a funcionalidades sensibles (reservas, gestión de complejo, datos de clientes).
- Esto se alinea con buenas prácticas de seguridad y con la integridad de las comunicaciones transaccionales (email de recordatorios #34) que ya enviamos a esa dirección.

## What
- **Registro tradicional (email + contraseña):** crear usuario con `emailVerified = false`, generar token de verificación único (expiración configurable), enviar email de verificación y **bloquear login** hasta confirmar. Permitir reenviar token.
- **Login tradicional:** rechazar con mensaje claro si `emailVerified === false`, ofreciendo opción de reenviar verificación.
- **OAuth (Google, Apple, Microsoft):** solo crear/autenticar sesión si el proveedor indica `email_verified === true`. Si `email_verified === false` (o campo ausente/no confiable), **NO autenticar**: enviar email de verificación con enlace/token a esa dirección y solicitar confirmación antes de permitir login. Nunca elevar privilegios con email no verificado.
- **Verificación de token:** endpoint para confirmar email (token válido, no usado, no expirado). Al confirmar, marcar `emailVerified = true`, invalidar token usado y permitir login.
- **Protección anti-tempmail (opcional pero recomendable):** permitir lista blanca/negra o bloquear dominios conocidos de emails desechables. Al menos registrar intento y rechazar registro con mensaje genérico (no revelar lista).
- **Seguridad del token:** aleatorio criptográficamente fuerte, almacenable con hash (no en claro), expiración corta (p.ej. 10–30 min), un solo uso, rotación al reenviar.
- **UX:** mensajes claros, sin filtrar existencia de email (responder genéricamente en errores para evitar user enumeration donde corresponda), pero guiar a verificar bandeja/spam.

## Impact
- **Esquema B2B (usuarios):** agregar `emailVerified` (boolean, default false), índices si hace falta. Migración no destructiva.
- **Auth B2B:** nuevos endpoints: `POST /api/v1/auth/resend-verification`, `POST /api/v1/auth/verify-email` (o GET con token por link). Cambiar flujo de register/login.
- **OAuth:** validar claim `email_verified` según proveedor (mapear correctamente Google `email_verified`, Apple puede requerir verificación de email, Microsoft variable).
- **Emailing:** reutilizar infraestructura de SMTP (#34) para enviar emails de verificación (plantilla transaccional). Usar mismo proveedor `log`/`smtp` por entorno.
- **Frontend B2B:** pantalla/modal para "Verificá tu email" tras registro, botón "Reenviar email de verificación", pantalla de confirmación de token (éxito/error/expirado).
- **Seguridad:** reduce riesgo de cuentas falsas, mejora entregabilidad de recordatorios (evita bounces) y protege flujos sensibles.

## Risks
- **UX fricción:** nuevo paso obligatorio puede reducir conversión de registro. Mitigar con mensajes claros y reenvío fácil.
- **OAuth estricto:** algunos proveedores antiguos o configuraciones pueden no marcar verificado; exigirlo puede bloquear login legítimo. Mitigar: **solo bloquear cuando explícitamente `false` o ausente** y ofrecer flujo de verificación por email (no rechazar silenciosamente).
- **Deliverability:** emails de verificación deben ir por SMTP válido (no solo log) en producción y tener configuración SPF/DKIM adecuada (depende del dominio del remitente).
- **Migración:** usuarios existentes tendrán `emailVerified = false` tras migración. Definir política: ¿forzar verificación en próximo login? ¿conceder grace period? Recomendado: forzar verificación en próximo intento de login para cuentas con acceso a funcionalidades operativas (staff), o permitir acceso limitado hasta verificación según riesgo.
- **Token leakage:** enlaces con token en URL pueden quedar en logs/proxies; preferir enlace corto con token y también aceptar token en body, además de expirar rápido y single-use.
