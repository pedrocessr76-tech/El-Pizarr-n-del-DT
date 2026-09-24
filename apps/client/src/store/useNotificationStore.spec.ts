import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from './useNotificationStore';
import type { NotificationPayload } from '../../../../packages/shared/types/models';

const payload = (): NotificationPayload => ({
  type: 'goal',
  severity: 'info',
  title: 'Gol de Messi',
  body: 'Empate parcial 1-1',
  timestamp: Date.now(),
});

beforeEach(() => {
  useNotificationStore.setState({ notifications: [], toasts: [], unreadCount: 0 });
});

describe('useNotificationStore', () => {
  it('addNotification agrega a notificaciones, toasts y cuenta no leídas', () => {
    useNotificationStore.getState().addNotification(payload());

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.toasts).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].title).toBe('Gol de Messi');
    expect(state.notifications[0].read).toBe(false);
    expect(state.notifications[0].id).toBeTruthy();
  });

  it('addNotification con read=true no infla el contador', () => {
    useNotificationStore.getState().addNotification({ ...payload(), read: true });

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('markAsRead baja el contador', () => {
    useNotificationStore.getState().addNotification(payload());
    const id = useNotificationStore.getState().notifications[0].id;

    useNotificationStore.getState().markAsRead(id);

    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('markAllAsRead deja todo leído', () => {
    const store = useNotificationStore.getState();
    store.addNotification(payload());
    store.addNotification({ ...payload(), title: 'Segundo', type: 'user_turn' });

    useNotificationStore.getState().markAllAsRead();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications.every((n) => n.read)).toBe(true);
  });

  it('removeToast solo saca el toast', () => {
    useNotificationStore.getState().addNotification(payload());
    const id = useNotificationStore.getState().notifications[0].id;

    useNotificationStore.getState().removeToast(id);

    expect(useNotificationStore.getState().toasts).toHaveLength(0);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it('clearAll vacía todo', () => {
    const store = useNotificationStore.getState();
    store.addNotification(payload());
    store.addNotification(payload());

    useNotificationStore.getState().clearAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.toasts).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });
});