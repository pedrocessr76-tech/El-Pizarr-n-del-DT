import { api } from './api';
import { getAuthToken, isGuestUserId, setGuestToken, setUserToken } from '../utils/session';

export interface AuthUser {
  id: string;
  username: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  async register(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { username, password });
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
    return data;
  },

  async guest(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/guest');
    return data;
  },

  async getProfile(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/profile');
    return data;
  },

  /** Restaura la sesión desde la cookie HttpOnly del refresh token. */
  async refresh(): Promise<AuthResponse | null> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/refresh');
      return data;
    } catch {
      return null;
    }
  },

  /** Cierra la sesión en el servidor (borra la cookie) y limpia la memoria. */
  async logout(): Promise<void> {
    await api.post('/auth/logout').catch(() => {});
    setUserToken(null);
    setGuestToken(null);
  },
};

/**
 * Garantiza que haya un token efectivo (usuario o invitado) en memoria y
 * devuelve el token activo:
 *  1. si ya hay token (usuario o invitado), lo devuelve;
 *  2. si la cookie HttpOnly tiene una sesión, la restaura vía /auth/refresh;
 *  3. como último recurso crea una identidad anónima en el servidor.
 *
 * Dispara `epdt:guest-token` cuando queda un invitado activo (lo escucha el
 * socket de notificaciones) y `epdt:user-session` cuando se restauró un
 * usuario real (lo hidrata el store de auth).
 */
export async function ensureGuestToken(): Promise<string | null> {
  const inMemory = getAuthToken();
  if (inMemory) return inMemory;

  const restored = await authService.refresh();
  if (restored) {
    if (isGuestUserId(restored.user.id)) {
      setGuestToken(restored.accessToken);
      window.dispatchEvent(new CustomEvent('epdt:guest-token', { detail: restored.accessToken }));
    } else {
      setUserToken(restored.accessToken);
      window.dispatchEvent(new CustomEvent('epdt:user-session', { detail: restored }));
    }
    return restored.accessToken;
  }

  const { accessToken } = await authService.guest();
  setGuestToken(accessToken);
  window.dispatchEvent(new CustomEvent('epdt:guest-token', { detail: accessToken }));
  return accessToken;
}