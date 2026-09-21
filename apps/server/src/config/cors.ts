/**
 * Perímetro HTTP y WebSocket (Fase 3 de la auditoría).
 *
 * La API nunca refleja un origen arbitrario: el origen permitido sale de la
 * allowlist `CORS_ORIGIN` (lista separada por comas). Si no está definida, en
 * desarrollo se permite únicamente localhost del dev-server de Vite y en
 * producción ninguna origen cruzado (sólo misma-origen). Sin comodines.
 */

const PRODUCTION = process.env.NODE_ENV === 'production';

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function defaultOrigins(isProduction: boolean): string[] {
  if (isProduction) return [];
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

const configuredOrigins = parseList(process.env.CORS_ORIGIN);
const exportedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins(PRODUCTION);

/** Orígenes HTTP/WS permitidos (se exporta para tests y depuración). */
export const allowedOrigins: readonly string[] = exportedOrigins;

/**
 * Sin cabecera Origin → misma-origen o cliente no-navegador (curl, test):
 * permitido. Con Origin → sólo si está en la allowlist. No permite '*'.
 */
export function isOriginAllowed(origin: string | undefined | null): boolean {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

/** Función `origin` para socket.io (cors.origin). Bloquea handshakes ajenos. */
export function wsOriginCheck(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
): void {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('CORS: origen no permitido para WebSocket.'));
}