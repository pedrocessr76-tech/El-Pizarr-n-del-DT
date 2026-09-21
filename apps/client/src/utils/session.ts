const GUEST_TOKEN_KEY = 'epdt_guest_token';

/**
 * Token de identidad anónima (invitado), emitido por el SERVIDOR vía POST /auth/guest
 * y guardado en sessionStorage. A diferencia del viejo `sessionId` (inventado por el
 * cliente), este token viaja firmado y la autorización la decide el backend.
 */
export function getGuestToken(): string | null {
  return sessionStorage.getItem(GUEST_TOKEN_KEY);
}

export function setGuestToken(token: string): void {
  sessionStorage.setItem(GUEST_TOKEN_KEY, token);
}

/** Token efectivo para las peticiones: usuario logueado o invitado anónimo. */
export function getAuthToken(): string | null {
  return localStorage.getItem('token') || getGuestToken();
}

export function clearGuestSession(): void {
  sessionStorage.removeItem(GUEST_TOKEN_KEY);
}