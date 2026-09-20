import { create } from 'zustand';
import { b2bService, type B2bUser } from '../services/b2bService';

interface B2bState {
  user: B2bUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  registerClient: (input: { email: string; fullName: string; password: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const storedUser = localStorage.getItem('b2bUser');

function persistAuth(response: { accessToken: string; user: B2bUser }): { user: B2bUser; token: string } {
  localStorage.setItem('b2bToken', response.accessToken);
  localStorage.setItem('b2bUser', JSON.stringify(response.user));
  return { user: response.user, token: response.accessToken };
}

export const useB2bStore = create<B2bState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem('b2bToken'),
  isLoading: false,
  error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await b2bService.login(email, password);
      set({ ...persistAuth(response), isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'No se pudo iniciar sesión.' });
      return false;
    }
  },
  registerClient: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await b2bService.registerClient(input);
      set({ ...persistAuth(response), isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'No se pudo crear la cuenta de cliente.' });
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem('b2bToken');
    localStorage.removeItem('b2bUser');
    set({ user: null, token: null });
  },
  clearError: () => set({ error: null }),
}));