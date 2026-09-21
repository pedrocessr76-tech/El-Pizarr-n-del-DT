import { api } from './api';
import { getGuestToken, setGuestToken } from '../utils/session';

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
};

/**
 * Garantiza que haya un token efectivo (usuario o invitado) y lo persiste en
 * sessionStorage. Devuelve el token activo.
 */
export async function ensureGuestToken(): Promise<string> {
  const userToken = localStorage.getItem('token');
  if (userToken) return userToken;

  const existing = getGuestToken();
  if (existing) return existing;

  const { accessToken } = await authService.guest();
  setGuestToken(accessToken);
  window.dispatchEvent(new CustomEvent('epdt:guest-token', { detail: accessToken }));
  return accessToken;
}