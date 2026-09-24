import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { authService, ensureGuestToken } from './authService';

const apiMock = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

const sessionMock = vi.hoisted(() => ({
  getAuthToken: vi.fn(),
  isGuestUserId: vi.fn(),
  setGuestToken: vi.fn(),
  setUserToken: vi.fn(),
}));

vi.mock('./api', () => ({ api: apiMock }));
vi.mock('../utils/session', () => sessionMock);

const waitForEvent = (name: string) =>
  new Promise<Event>((resolve) => {
    window.addEventListener(name, (e) => resolve(e), { once: true });
  });

const USER_SESSION = {
  accessToken: 'user-token',
  user: { id: 'u1', username: 'coach', createdAt: '2025-01-01' },
};
const GUEST_SESSION = {
  accessToken: 'guest-token',
  user: { id: 'guest-abc', username: 'invitado', createdAt: '2025-01-01' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService (contratos HTTP)', () => {
  it('login hace POST /auth/login y devuelve la sesión', async () => {
    apiMock.post.mockResolvedValue({ data: USER_SESSION });

    const result = await authService.login('coach', 'secreto');

    expect(apiMock.post).toHaveBeenCalledWith('/auth/login', { username: 'coach', password: 'secreto' });
    expect(result).toEqual(USER_SESSION);
  });

  it('register hace POST /auth/register', async () => {
    apiMock.post.mockResolvedValue({ data: USER_SESSION });

    await authService.register('coach', 'secreto');

    expect(apiMock.post).toHaveBeenCalledWith('/auth/register', { username: 'coach', password: 'secreto' });
  });

  it('guest hace POST /auth/guest', async () => {
    apiMock.post.mockResolvedValue({ data: GUEST_SESSION });

    const result = await authService.guest();

    expect(apiMock.post).toHaveBeenCalledWith('/auth/guest');
    expect(result).toEqual(GUEST_SESSION);
  });

  it('refresh devuelve null si falla', async () => {
    apiMock.post.mockRejectedValue(new Error('net'));

    const result = await authService.refresh();

    expect(result).toBeNull();
  });

  it('logout avisa al servidor y limpia tokens en memoria aunque falle la API', async () => {
    apiMock.post.mockRejectedValue(new Error('net'));

    await authService.logout();

    expect(apiMock.post).toHaveBeenCalledWith('/auth/logout');
    expect(sessionMock.setUserToken).toHaveBeenCalledWith(null);
    expect(sessionMock.setGuestToken).toHaveBeenCalledWith(null);
  });
});

describe('ensureGuestToken (arranque/invitado, issue #17)', () => {
  it('si hay token en memoria lo devuelve sin llamar al servidor', async () => {
    (sessionMock.getAuthToken as Mock).mockReturnValue('mem-token');

    const token = await ensureGuestToken();

    expect(token).toBe('mem-token');
    expect(apiMock.post).not.toHaveBeenCalled();
  });

  it('restaura invitado vía refresh y dispara epdt:guest-token', async () => {
    (sessionMock.getAuthToken as Mock).mockReturnValue(null);
    (sessionMock.isGuestUserId as Mock).mockReturnValue(true);
    apiMock.post.mockResolvedValue({ data: GUEST_SESSION });
    const event = waitForEvent('epdt:guest-token');

    const token = await ensureGuestToken();

    const ev = await event;
    expect(token).toBe('guest-token');
    expect(sessionMock.setGuestToken).toHaveBeenCalledWith('guest-token');
    expect((ev as CustomEvent).detail).toBe('guest-token');
  });

  it('restaura usuario real vía refresh y dispara epdt:user-session', async () => {
    (sessionMock.getAuthToken as Mock).mockReturnValue(null);
    (sessionMock.isGuestUserId as Mock).mockReturnValue(false);
    apiMock.post.mockResolvedValue({ data: USER_SESSION });
    const event = waitForEvent('epdt:user-session');

    const token = await ensureGuestToken();

    const ev = await event;
    expect(token).toBe('user-token');
    expect(sessionMock.setUserToken).toHaveBeenCalledWith('user-token');
    expect((ev as CustomEvent).detail).toEqual(USER_SESSION);
  });

  it('crea identidad anónima cuando no hay refresco posible', async () => {
    (sessionMock.getAuthToken as Mock).mockReturnValue(null);
    apiMock.post.mockResolvedValueOnce(null).mockResolvedValueOnce({ data: GUEST_SESSION });
    const event = waitForEvent('epdt:guest-token');

    const token = await ensureGuestToken();

    await event;
    expect(apiMock.post).toHaveBeenCalledWith('/auth/refresh');
    expect(apiMock.post).toHaveBeenCalledWith('/auth/guest');
    expect(token).toBe('guest-token');
    expect(sessionMock.setGuestToken).toHaveBeenCalledWith('guest-token');
  });
});