import { api } from './api';

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

  async getProfile(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/profile');
    return data;
  },
};