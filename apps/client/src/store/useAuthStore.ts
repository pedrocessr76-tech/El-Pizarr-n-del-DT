import { create } from 'zustand';
import { authService, type AuthResponse, type AuthUser } from '../services/authService';
import { useDraftStore } from './useDraftStore';
import { clearGuestSession, clearSessionTokens, getGuestToken, setUserToken } from '../utils/session';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: (callServer?: boolean) => Promise<void>;
  setSession: (session: AuthResponse) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Los tokens viven sólo en memoria (issue #17); se restauran vía cookie.
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setSession: (session) => {
    setUserToken(session.accessToken);

    // Si había un token invitado, descartarlo: la identidad nueva es la del usuario.
    const hadGuest = Boolean(getGuestToken());
    clearGuestSession();
    set({ user: session.user, token: session.accessToken, error: null });

    if (hadGuest) {
      useDraftStore.getState().setTeamId(null);
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(username, password);
      get().setSession(response);
      set({ isLoading: false });
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
      get().setSession(response);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al registrarse';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async (callServer = true) => {
    // Pide al servidor que borre la cookie HttpOnly del refresh; cuando la
    // sesión ya expiró (evento epdt:session-expired) se salta la llamada.
    if (callServer) {
      await authService.logout();
    }
    clearSessionTokens();
    useDraftStore.getState().resetAll();
    set({ user: null, token: null, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));