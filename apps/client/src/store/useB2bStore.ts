import { create } from 'zustand';
import { b2bService, setB2bAccessToken, type B2bAuthResponse, type B2bUser } from '../services/b2bService';

interface B2bState {
  user: B2bUser | null;
  token: string | null;
  orgTimezone: string | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Email a quien se mandó el enlace tras un registro, para que la pantalla
   * "verificá tu email" sepa a quién ofrecer el reenvío. Se limpia al entrar.
   */
  pendingVerificationEmail: string | null;
  /** Última razón por la que el login se frenó: alimenta el reenvío desde el error. */
  loginBlockedByVerification: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  registerClient: (input: { email: string; fullName: string; password: string }) => Promise<boolean>;
  onboardOwner: (input: { organizationName: string; facilityName?: string; ownerFullName: string; email: string; password: string }) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<{ ok: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ ok: boolean; message: string }>;
  clearPendingVerification: () => void;
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
  pendingVerificationEmail: null,
  loginBlockedByVerification: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null, loginBlockedByVerification: false });
    try {
      const response = await b2bService.login(email, password);
      set({ ...applyAuth(response), isLoading: false });
      return true;
    } catch (error: any) {
      // Un 401 que pide verificar no es un rechazo de credenciales: se marca
      // aparte para que el mismo formulario ofrezca el reenvío, sin sacar a la
      // persona a otra pantalla.
      const blocked = /verific/i.test(error.response?.data?.message ?? '');
      set({
        isLoading: false,
        error: error.response?.data?.message || 'No se pudo iniciar sesión.',
        loginBlockedByVerification: blocked,
      });
      return false;
    }
  },

  // El registro ya no devuelve sesión: queda la cuenta esperando el email.
  registerClient: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await b2bService.registerClient(input);
      set({ isLoading: false, pendingVerificationEmail: response.email, loginBlockedByVerification: false });
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
      set({ isLoading: false, pendingVerificationEmail: response.email, loginBlockedByVerification: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'No se pudo crear el complejo.' });
      return false;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await b2bService.verifyEmail(token);
      set({ pendingVerificationEmail: null });
      return { ok: true, message: response.message };
    } catch (error: any) {
      // 4xx con motivo (vencido, usado, inválido): lo muestra la pantalla con
      // la opción de pedir uno nuevo.
      return { ok: false, message: error.response?.data?.message || 'El enlace de verificación no es válido.' };
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await b2bService.resendVerification(email);
      set({ pendingVerificationEmail: email });
      return { ok: true, message: response.message };
    } catch (error: any) {
      return { ok: false, message: error.response?.data?.message || 'No se pudo reenviar el email.' };
    }
  },

  clearPendingVerification: () => set({ pendingVerificationEmail: null, loginBlockedByVerification: false }),

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
    set({ user: null, token: null, orgTimezone: null, error: null, pendingVerificationEmail: null, loginBlockedByVerification: false });
  },

  clearError: () => set({ error: null, loginBlockedByVerification: false }),
}));