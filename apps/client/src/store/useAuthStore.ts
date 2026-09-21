import { create } from 'zustand';
import { authService, type AuthUser } from '../services/authService';
import { useDraftStore } from './useDraftStore';
import { clearGuestSession } from '../utils/session';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

export const useAuthStore = create<AuthState>()((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(username, password);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ user: response.user, token: response.accessToken, isLoading: false });

      // Si había un token invitado, descartarlo: la identidad nueva es la del usuario.
      const hadGuest = Boolean(sessionStorage.getItem('epdt_guest_token'));
      clearGuestSession();
      if (hadGuest) {
        useDraftStore.getState().setTeamId(null);
      }

      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  register: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(username, password);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ user: response.user, token: response.accessToken, isLoading: false });

      // Si había un token invitado, descartarlo: la identidad nueva es la del usuario.
      const hadGuest = Boolean(sessionStorage.getItem('epdt_guest_token'));
      clearGuestSession();
      if (hadGuest) {
        useDraftStore.getState().setTeamId(null);
      }

      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al registrarse';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    // No se borran datos del servidor al salir: la identidad queda como está. Los
    // equipos de INVITADOS se limpian con DELETE /draft/data al cerrar la pestaña
    // (pagehide), nunca con el token de un usuario logueado.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearGuestSession();
    useDraftStore.getState().resetAll();
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));