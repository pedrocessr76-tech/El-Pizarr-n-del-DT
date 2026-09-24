/**
 * Sesión del juego íntegramente EN MEMORIA (issue #17).
 *
 * El access token (usuario o invitado) nunca se persiste en
 * localStorage/sessionStorage: un XSS ya no puede robarlo. La sesión larga la
 * renueva el refresh token que la API guarda en cookie HttpOnly, y se recupera
 * al recargar con POST /auth/refresh (ensureGuestToken / restore).
 */

const GUEST_ID_PREFIX = 'guest-';

let userAccessToken: string | null = null;
let guestAccessToken: string | null = null;

/** Token de identidad anónima (invitado), emitido por POST /auth/guest (en memoria). */
export function getGuestToken(): string | null {
  return guestAccessToken;
}

export function setGuestToken(token: string | null): void {
  guestAccessToken = token;
}

/** Access token del usuario logueado (en memoria). */
export function setUserToken(token: string | null): void {
  userAccessToken = token;
}

export function hasUserToken(): boolean {
  return Boolean(userAccessToken);
}

/** Token efectivo para las peticiones: usuario logueado o invitado anónimo. */
export function getAuthToken(): string | null {
  return userAccessToken ?? guestAccessToken;
}

export function clearGuestSession(): void {
  guestAccessToken = null;
}

export function clearSessionTokens(): void {
  userAccessToken = null;
  guestAccessToken = null;
}

/** Componentes UI que quieren saber si un store es de invitado (guest-*). */
export function isGuestUserId(id: string | null | undefined): boolean {
  return Boolean(id && id.startsWith(GUEST_ID_PREFIX));
}