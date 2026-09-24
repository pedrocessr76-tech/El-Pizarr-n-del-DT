import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from './NotificationBell';
import { useNotificationStore } from '../store/useNotificationStore';
import type { NotificationPayload } from '../../../../packages/shared/types/models';

const notification = (): NotificationPayload & { read?: boolean } => ({
  type: 'goal',
  severity: 'info',
  title: 'Gol',
  body: 'Equipo local 1-0',
  timestamp: Date.now(),
});

beforeEach(() => {
  useNotificationStore.setState({ notifications: [], toasts: [], unreadCount: 0 });
});

describe('NotificationBell', () => {
  it('no muestra badge sin no leídas y lo muestra con no leídas', () => {
    const { rerender } = render(<NotificationBell />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();

    act(() => {
      useNotificationStore.getState().addNotification(notification());
    });
    rerender(<NotificationBell />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('acota el badge a 99+', () => {
    act(() => {
      useNotificationStore.getState().addNotification(notification());
      useNotificationStore.getState().addNotification({ ...notification(), title: 'N2' });
      useNotificationStore.setState({ unreadCount: 150 });
    });

    render(<NotificationBell />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('abre el panel de notificaciones al hacer clic', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    const button = screen.getByRole('button', { name: /ver notificaciones/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);

    expect(screen.getByRole('dialog', { name: 'Centro de notificaciones' })).toBeInTheDocument();
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('lista las notificaciones al abrirse', async () => {
    const user = userEvent.setup();
    act(() => {
      useNotificationStore.getState().addNotification(notification());
    });
    render(<NotificationBell />);

    await user.click(screen.getByRole('button', { name: /ver notificaciones/i }));

    expect(screen.getByText('Gol')).toBeInTheDocument();
  });
});