import { create } from 'zustand';
import { b2bService, setB2bAccessToken, type B2bAuthResponse, type B2bUser } from '../services/b2bService';

interface B2bState {
  user: B2bUser | null;
  token: string | null;
  orgTimezone: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  registerClient: (input: { email: string; fullName: string; password: string }) => Promise<boolean>;
  onboardOwner: (input: { organizationName: string; facilityName?: string; ownerFullName: string; email: string; password: string }) => Promise<boolean>;
  hydrate: () => Promise<boolean>;
  loadOrgTimezone: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function applyAuth(session: B2bAuthResponse): { user: B2bUser; token: string } {
  // El token vive sólo en memoria (issue #17); la sesión larga viaja en cookie.
  setB2bAccessToken(session.accessToken);
  return { user: session.user, token: session.accessToken };
}

export const useB2bStore = create<B2bState>((set) => ({
  user: null,
  token: null,
  orgTimezone: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await b2bService.login(email, password);
      set({ ...applyAuth(response), isLoading: false });
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
      set({ ...applyAuth(response), isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'No se pudo crear la cuenta de cliente.' });
      return false;
    }
  },

  onboardOwner: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await b2bService.onboardOwner(input);
      set({ ...applyAuth(response), isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'No se pudo crear el complejo.' });
      return false;
    }
  },

  /** Restaura la sesión desde la cookie HttpOnly (al entrar a /canchas). */
  hydrate: async () => {
    const session = await b2bService.refresh();
    if (!session) return false;
    set({ ...applyAuth(session) });
    return true;
  },

  /** Carga la zona horaria de la organización (issue #24) para fijar horarios. */
  loadOrgTimezone: async () => {
    try {
      const organization = await b2bService.getOrganization();
      set({ orgTimezone: organization.timezone });
    } catch {
      set({ orgTimezone: null });
    }
  },

  logout: async () => {
    await b2bService.logout();
    set({ user: null, token: null, orgTimezone: null, error: null });
  },

  clearError: () => set({ error: null }),
}));