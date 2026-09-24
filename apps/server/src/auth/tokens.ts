import type { Request, Response } from 'express';

/**
 * Sesiones con refresh token en cookie HttpOnly (issue #17).
 *
 * El access token (corto, en memoria en el cliente) viaja en `Authorization:
 * Bearer`. El refresh token viaja en cookie HttpOnly + SameSite=Lax, fuera del
 * alcance de un XSS de localStorage. Como ningún otro endpoint se autentica
 * con cookie, la superficie CSRF queda reducida a refresh/logout (que además
 * validan el Origin con CsrfRefreshGuard).
 */

export const REFRESH_COOKIE = 'epdt_refresh';
export const B2B_REFRESH_COOKIE = 'epdt_b2b_refresh';

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL = '7d';
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Claim que distingue el refresh token del access token al verificar. */
export const REFRESH_TOKEN_TYPE = 'refresh';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * En producción el frontend y la API viven en dominios distintos (Render
 * Static Site vs Web Service). La cookie del refresh token DEBE viajar en
 * requests cross-origin iniciados desde JS (POST /auth/refresh), lo que
 * requiere SameSite=None + Secure=true.
 *
 * En desarrollo frontend y API están en el mismo origen (Vite proxy), por lo
 * que SameSite=Lax es suficiente y más restrictivo.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: (IS_PRODUCTION ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

export function setRefreshCookie(res: Response, cookieName: string, token: string): void {
  res.cookie(cookieName, token, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_TTL_MS });
}

export function clearRefreshCookie(res: Response, cookieName: string): void {
  res.clearCookie(cookieName, COOKIE_OPTIONS);
}

/** Lee una cookie sin depender del middleware cookie-parser. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}