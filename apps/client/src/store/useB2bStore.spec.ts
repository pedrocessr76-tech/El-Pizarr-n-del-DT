import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useB2bStore } from './useB2bStore';
import { b2bService } from '../services/b2bService';

vi.mock('../services/b2bService', () => ({
  b2bService: {
    login: vi.fn(),
    registerClient: vi.fn(),
    onboardOwner: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    refresh: vi.fn(),
    getOrganization: vi.fn(),
    logout: vi.fn(),
  },
  setB2bAccessToken: vi.fn(),
}));

const loginMock = vi.mocked(b2bService.login);
const registerMock = vi.mocked(b2bService.registerClient);
const onboardMock = vi.mocked(b2bService.onboardOwner);
const verifyMock = vi.mocked(b2bService.verifyEmail);
const resendMock = vi.mocked(b2bService.resendVerification);

const SESSION = {
  accessToken: 'tok',
  user: { userId: 'u1', organizationId: 'o1', email: 'ana@club.com', roles: ['CLIENT'] },
};

beforeEach(() => {
  vi.clearAllMocks();
  useB2bStore.setState({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    pendingVerificationEmail: null,
    loginBlockedByVerification: false,
  });
});

describe('useB2bStore: registro sin sesión', () => {
  it('el registro de cliente deja el email pendiente y NO abre sesión', async () => {
    registerMock.mockResolvedValue({ email: 'ana@club.com', emailVerified: false, message: 'Revisá tu email.' });

    const ok = await useB2bStore.getState().registerClient({ email: 'ana@club.com', fullName: 'Ana', password: '123456' });

    expect(ok).toBe(true);
    expect(useB2bStore.getState().pendingVerificationEmail).toBe('ana@club.com');
    expect(useB2bStore.getState().user).toBeNull();
    expect(useB2bStore.getState().token).toBeNull();
  });

  it('el onboarding del propietario también queda pendiente', async () => {
    onboardMock.mockResolvedValue({ email: 'owner@club.com', emailVerified: false, message: 'Revisá tu email.' });

    await useB2bStore.getState().onboardOwner({
      organizationName: 'Los Amigos', ownerFullName: 'Ana', email: 'owner@club.com', password: '123456',
    });

    expect(useB2bStore.getState().pendingVerificationEmail).toBe('owner@club.com');
    expect(useB2bStore.getState().user).toBeNull();
  });
});

describe('useB2bStore: login bloqueado por verificación', () => {
  it('marca el bloqueo cuando el server pide verificar el email', async () => {
    loginMock.mockRejectedValue({ response: { status: 401, data: { message: 'Verificá tu email para poder entrar.' } } });

    const ok = await useB2bStore.getState().login('ana@club.com', '123456');

    expect(ok).toBe(false);
    expect(useB2bStore.getState().loginBlockedByVerification).toBe(true);
    // No debe saltar a la pantalla de "revisá tu email": el formulario ya ofrece el reenvío.
    expect(useB2bStore.getState().pendingVerificationEmail).toBeNull();
  });

  it('NO confunde credenciales inválidas con verificación pendiente', async () => {
    loginMock.mockRejectedValue({ response: { status: 401, data: { message: 'Credenciales inválidas.' } } });

    await useB2bStore.getState().login('ana@club.com', 'malaclave');

    expect(useB2bStore.getState().loginBlockedByVerification).toBe(false);
  });

  it('limpia el bloqueo cuando el login siguiente sí entra', async () => {
    loginMock.mockRejectedValueOnce({ response: { status: 401, data: { message: 'Verificá tu email.' } } });
    loginMock.mockResolvedValueOnce(SESSION);

    await useB2bStore.getState().login('ana@club.com', '123456');
    const ok = await useB2bStore.getState().login('ana@club.com', '123456');

    expect(ok).toBe(true);
    expect(useB2bStore.getState().loginBlockedByVerification).toBe(false);
    expect(useB2bStore.getState().user?.email).toBe('ana@club.com');
  });

  it('clearError también baja el bloqueo', async () => {
    loginMock.mockRejectedValue({ response: { status: 401, data: { message: 'Verificá tu email.' } } });
    await useB2bStore.getState().login('ana@club.com', '123456');

    useB2bStore.getState().clearError();

    expect(useB2bStore.getState().loginBlockedByVerification).toBe(false);
  });
});

describe('useB2bStore: verificar y reenviar', () => {
  it('verificar con éxito limpia el email pendiente', async () => {
    useB2bStore.setState({ pendingVerificationEmail: 'ana@club.com' });
    verifyMock.mockResolvedValue({ verified: true, message: 'Email verificado. Ya podés entrar.' });

    const result = await useB2bStore.getState().verifyEmail('tok');

    expect(result.ok).toBe(true);
    expect(useB2bStore.getState().pendingVerificationEmail).toBeNull();
  });

  it('un token rechazado devuelve el motivo sin romper la pantalla', async () => {
    verifyMock.mockRejectedValue({ response: { status: 400, data: { message: 'El enlace venció.' } } });

    const result = await useB2bStore.getState().verifyEmail('viejo');

    expect(result).toEqual({ ok: false, message: 'El enlace venció.' });
  });

  it('un token sin formato devuelve un mensaje genérico', async () => {
    verifyMock.mockRejectedValue({});

    const result = await useB2bStore.getState().verifyEmail('');

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/no es válido/i);
  });

  it('reenviar deja anotado a quién se le pidió', async () => {
    resendMock.mockResolvedValue({ message: 'Si la cuenta existe, te enviamos un enlace nuevo.' });

    const result = await useB2bStore.getState().resendVerification('ana@club.com');

    expect(result.ok).toBe(true);
    expect(useB2bStore.getState().pendingVerificationEmail).toBe('ana@club.com');
  });
});