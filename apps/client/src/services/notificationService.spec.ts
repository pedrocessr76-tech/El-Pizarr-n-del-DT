import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNotificationSocket } from './notificationService';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { setGuestToken, setUserToken } from '../utils/session';
import type { NotificationPayload } from '../../../../packages/shared/types/models';

const harness = vi.hoisted(() => {
  const makeSocket = () => {
    const listeners: Record<string, Array<(payload: unknown) => void>> = {};
    const socket: any = {
      on: vi.fn((event: string, cb: (payload: unknown) => void) => {
        (listeners[event] ??= []).push(cb);
        return socket;
      }),
      off: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      _listeners: listeners,
    };
    return socket;
  };
  const sockets: any[] = [];
  const io = vi.fn(() => {
    const socket = makeSocket();
    sockets.push(socket);
    return socket;
  });
  const emit = (event: string, payload: unknown) =>
    (sockets[sockets.length - 1]._listeners[event] ?? []).forEach((cb: (p: unknown) => void) => cb(payload));
  return { io, emit, sockets };
});

vi.mock('socket.io-client', () => ({ io: harness.io }));

const PAYLOAD: NotificationPayload = {
  type: 'b2b_booking_pending',
  severity: 'info',
  title: 'Nueva reserva pendiente',
  body: 'Te espera para confirmar',
  timestamp: Date.now(),
};

const ioOptions = (callIndex: number): Record<string, any> =>
  (harness.io.mock.calls[callIndex] as unknown as [string, Record<string, any>])[1];

const hooks: Array<{ unmount: () => void }> = [];

afterEach(() => {
  hooks.splice(0).forEach((h) => h.unmount());
});

beforeEach(() => {
  setUserToken(null);
  setGuestToken(null);
  useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
  useNotificationStore.setState({ notifications: [], toasts: [], unreadCount: 0 });
  harness.io.mockClear();
  harness.sockets.length = 0;
});

describe('useNotificationSocket', () => {
  it('conecta con el token de invitado si no hay usuario', () => {
    setGuestToken('g-token');

    hooks.push(renderHook(() => useNotificationSocket()));

    expect(harness.io).toHaveBeenCalledTimes(1);
    expect(harness.io).toHaveBeenCalledWith('http://localhost:3000', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token: 'g-token' },
    });
  });

  it('prioriza el token de usuario del store sobre el invitado', () => {
    setGuestToken('g-token');
    setUserToken('u-token');
    useAuthStore.setState({ token: 'u-token' });

    hooks.push(renderHook(() => useNotificationSocket()));

    expect(ioOptions(0).auth.token).toBe('u-token');
  });

  it('no conecta si no hay token efectivo', () => {
    hooks.push(renderHook(() => useNotificationSocket()));

    expect(harness.io).not.toHaveBeenCalled();
  });

  it('recibe eventos notification y los ingresa al store', () => {
    setGuestToken('g-token');
    hooks.push(renderHook(() => useNotificationSocket()));

    act(() => harness.emit('notification', PAYLOAD));

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe('Nueva reserva pendiente');
    expect(state.unreadCount).toBe(1);
  });

  it('se desconecta al desmontar', () => {
    setGuestToken('g-token');
    const { unmount } = renderHook(() => useNotificationSocket());
    expect(harness.io).toHaveBeenCalledTimes(1);

    unmount();

    expect(harness.sockets[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('reconecta cuando se renueva el token de invitado (epdt:guest-token)', () => {
    setGuestToken('g-token');
    hooks.push(renderHook(() => useNotificationSocket()));
    expect(harness.io).toHaveBeenCalledTimes(1);

    setGuestToken('g-token-2');
    act(() => {
      window.dispatchEvent(new CustomEvent('epdt:guest-token', { detail: 'g-token-2' }));
    });

    expect(harness.io).toHaveBeenCalledTimes(2);
    expect(ioOptions(1).auth.token).toBe('g-token-2');
  });
});