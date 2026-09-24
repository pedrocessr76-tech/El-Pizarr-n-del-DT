import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NotificationToast } from './NotificationToast';
import { useNotificationStore } from '../store/useNotificationStore';
import type { NotificationItem } from '../store/useNotificationStore';

const item: NotificationItem = {
  id: 't1',
  type: 'b2b_booking_confirmed',
  severity: 'success',
  title: 'Reserva confirmada',
  body: 'Cancha 1 · Hoy 22:00',
  timestamp: Date.now(),
  read: false,
};

beforeEach(() => {
  useNotificationStore.setState({ notifications: [], toasts: [], unreadCount: 0 });
  vi.useRealTimers();
});

describe('NotificationToast', () => {
  it('muestra título y cuerpo del toast', () => {
    render(<NotificationToast item={item} />);

    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    expect(screen.getByText('Cancha 1 · Hoy 22:00')).toBeInTheDocument();
  });

  it('se descarta solo tras la animación de salida', () => {
    vi.useFakeTimers();
    useNotificationStore.setState({ toasts: [item], notifications: [item], unreadCount: 0 });
    render(<NotificationToast item={item} />);

    act(() => {
      vi.advanceTimersByTime(4500);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('botón cerrar elimina el toast y no afecta notificaciones', () => {
    vi.useFakeTimers();
    useNotificationStore.setState({ toasts: [item], notifications: [item], unreadCount: 0 });
    render(<NotificationToast item={item} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(useNotificationStore.getState().toasts).toHaveLength(0);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });
});