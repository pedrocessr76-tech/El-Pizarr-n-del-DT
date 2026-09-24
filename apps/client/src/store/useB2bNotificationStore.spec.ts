import { beforeEach, describe, expect, it } from 'vitest';
import { contentKeyOf, notificationToItem, useB2bNotificationStore } from './useB2bNotificationStore';
import type { B2bNotificationPayload } from '../../../../packages/shared/types/models';

const makePayload = (overrides: Partial<B2bNotificationPayload> = {}): B2bNotificationPayload => ({
  id: 'n1',
  type: 'b2b_booking_confirmed',
  severity: 'success',
  title: 'Reserva confirmada',
  body: 'Cancha 1 · Hoy 22:00',
  timestamp: 1730000000000,
  createdAt: '2025-10-27T12:00:00.000Z',
  read: false,
  ...overrides,
});

const RESET = { items: [], unreadCount: 0, hydrated: false, toasts: [] };

beforeEach(() => {
  useB2bNotificationStore.setState(RESET);
});

describe('useB2bNotificationStore (Sistema Canchas)', () => {
  it('contentKeyOf y notificationToItem derivan clave y fecha', () => {
    const item = notificationToItem(makePayload());

    expect(item.key).toBe(contentKeyOf('b2b_booking_confirmed', 'success', 'Reserva confirmada', 'Cancha 1 · Hoy 22:00'));
    expect(item.createdAt).toBe(Date.parse('2025-10-27T12:00:00.000Z'));
  });

  it('setItems calcula no leídas y marca hidratado', () => {
    useB2bNotificationStore.getState().setItems([makePayload(), makePayload({ id: 'n2', read: true })]);

    const state = useB2bNotificationStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.items).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
  });

  it('upsertFromSocket agrega una nueva y encola toast', () => {
    useB2bNotificationStore.getState().upsertFromSocket(makePayload());

    const state = useB2bNotificationStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].title).toBe('Reserva confirmada');
  });

  it('upsertFromSocket actualiza un duplicado sin duplicar el toast', () => {
    const store = useB2bNotificationStore.getState();
    store.upsertFromSocket(makePayload());
    useB2bNotificationStore.getState().upsertFromSocket(makePayload({ read: true }));

    const state = useB2bNotificationStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].read).toBe(true);
    expect(state.unreadCount).toBe(0);
    expect(state.toasts).toHaveLength(1);
  });

  it('markAsRead y markAllAsRead ajustan el contador', () => {
    const store = useB2bNotificationStore.getState();
    store.upsertFromSocket(makePayload());
    store.upsertFromSocket(makePayload({ id: 'n2', title: 'Pago recibido' }));

    const key = useB2bNotificationStore.getState().items[0].key;
    useB2bNotificationStore.getState().markAsRead(key);
    expect(useB2bNotificationStore.getState().unreadCount).toBe(1);

    useB2bNotificationStore.getState().markAllAsRead();
    expect(useB2bNotificationStore.getState().unreadCount).toBe(0);
  });

  it('dismissToast y reset limpian toasts/estado', () => {
    const store = useB2bNotificationStore.getState();
    store.upsertFromSocket(makePayload());

    useB2bNotificationStore.getState().dismissToast(useB2bNotificationStore.getState().toasts[0].key);
    expect(useB2bNotificationStore.getState().toasts).toHaveLength(0);

    useB2bNotificationStore.getState().reset();
    expect(useB2bNotificationStore.getState().items).toHaveLength(0);
    expect(useB2bNotificationStore.getState().hydrated).toBe(false);
  });
});