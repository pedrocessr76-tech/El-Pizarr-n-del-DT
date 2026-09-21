/**
 * Validación de secretos en tiempo de arranque.
 *
 * Sin secretos JWT fuertes la aplicación DEBE negarse a iniciar: un fallback
 * hardcodeado permitiría falsificar tokens con una clave públicamente conocida.
 */
const MIN_SECRET_LENGTH = 32;

function assertSecret(value: string | undefined, name: string): string {
  const secret = value?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[config] ${name} no está definido o tiene menos de ${MIN_SECRET_LENGTH} caracteres. ` +
        'El servidor se detiene para no firmar JWTs con un secreto débil. ' +
        'Generá uno con: openssl rand -hex 32',
    );
  }
  return secret;
}

export function requireJwtSecret(): string {
  return assertSecret(process.env.JWT_SECRET, 'JWT_SECRET');
}

export function requireB2bJwtSecret(): string {
  return assertSecret(process.env.B2B_JWT_SECRET, 'B2B_JWT_SECRET');
}