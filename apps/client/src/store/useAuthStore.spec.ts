import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { useDraftStore } from './useDraftStore';
import { authService } from '../services/authService';
import { clearSessionTokens, getGuestToken, setGuestToken } from '../utils/session';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    guest: vi.fn(),
    refresh: vi.fn(),
    getProfile: vi.fn(),
  },
}));

const loginMock = vi.mocked(authService.login);
const registerMock = vi.mocked(authService.register);
const logoutMock = vi.mocked(authService.logout);

const SESSION = { accessToken: 'user-token', user: { id: 'u1', username: 'coach' } };

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
  useDraftStore.setState({
    team: [],
    teamId: null,
    formation: '4-3-3',
    captainId: null,
    difficulty: 'Normal',
    tournament: null,
  });
  clearSessionTokens();
  vi.clearAllMocks();
});

describe('useAuthStore', () => {
  it('setSession guarda usuario/token y descarta la sesión invitado', () => {
    setGuestToken('guest-token');
    useDraftStore.getState().setTeamId('team-abc');

    useAuthStore.getState().setSession(SESSION);

    expect(useAuthStore.getState().user?.username).toBe('coach');
    expect(useAuthStore.getState().token).toBe('user-token');
    expect(useAuthStore.getState().error).toBeNull();
    expect(getGuestToken()).toBeNull();
    expect(useDraftStore.getState().teamId).toBeNull();
  });

  it('setSession sin sesión invitado previa no toca teamId del draft', () => {
    useDraftStore.getState().setTeamId('team-abc');

    useAuthStore.getState().setSession(SESSION);

    expect(useDraftStore.getState().teamId).toBe('team-abc');
  });

  it('login exitoso setea sesión y devuelve true', async () => {
    loginMock.mockResolvedValue(SESSION);

    const ok = await useAuthStore.getState().login('coach', 'secreto');

    expect(ok).toBe(true);
    expect(loginMock).toHaveBeenCalledWith('coach', 'secreto');
    expect(useAuthStore.getState().token).toBe('user-token');
    expect(useAuthStore.getState().user?.username).toBe('coach');
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('login fallido expone el mensaje del servidor y devuelve false', async () => {
    loginMock.mockRejectedValue({ response: { data: { message: 'Credenciales inválidas.' } } });

    const ok = await useAuthStore.getState().login('coach', 'malo');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('Credenciales inválidas.');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('login fallido sin mensaje usa el genérico', async () => {
    loginMock.mockRejectedValue(new Error('network'));

    await useAuthStore.getState().login('coach', 'malo');

    expect(useAuthStore.getState().error).toBe('Error al iniciar sesión');
  });

  it('register exitoso setea sesión y devuelve true', async () => {
    registerMock.mockResolvedValue(SESSION);

    const ok = await useAuthStore.getState().register('coach', 'secreto');

    expect(ok).toBe(true);
    expect(registerMock).toHaveBeenCalledWith('coach', 'secreto');
    expect(useAuthStore.getState().token).toBe('user-token');
  });

  it('register fallido devuelve false con mensaje de servidor', async () => {
    registerMock.mockRejectedValue({ response: { data: { message: 'El nombre ya existe.' } } });

    const ok = await useAuthStore.getState().register('coach', 'secreto');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('El nombre ya existe.');
  });

  it('logout avisa al servidor, limpia sesión y resetea el draft', async () => {
    useAuthStore.getState().setSession(SESSION);
    useDraftStore.getState().setTeamId('team-abc');
    logoutMock.mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useDraftStore.getState().teamId).toBeNull();
    expect(useDraftStore.getState().team).toHaveLength(0);
  });

  it('logout(callServer=false) no llama al servidor', async () => {
    useAuthStore.getState().setSession(SESSION);

    await useAuthStore.getState().logout(false);

    expect(logoutMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });
});