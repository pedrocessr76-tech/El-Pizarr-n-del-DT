import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { B2bNotificationBell } from './B2bNotificationBell';
import { useB2bNotificationStore } from '../../store/useB2bNotificationStore';
import { b2bNotificationService } from '../../services/b2bNotificationService';

beforeEach(() => {
  vi.spyOn(b2bNotificationService, 'markAllRead').mockResolvedValue(undefined);
  vi.spyOn(b2bNotificationService, 'markRead').mockResolvedValue(undefined);
  useB2bNotificationStore.getState().reset();
  useB2bNotificationStore.getState().setItems([{
    id: 'notification-1',
    type: 'pivot_contact_request',
    severity: 'info',
    title: 'Nueva solicitud para jugar',
    body: 'Un jugador quiere sumarte a un partido.',
    timestamp: Date.parse('2030-01-01T12:00:00Z'),
    createdAt: '2030-01-01T12:00:00Z',
    read: false,
    metadata: { conversationId: 'request-1' },
  }]);
});

describe('B2bNotificationBell: chat pivote', () => {
  it('abre el chat indicado por la notificación de solicitud', async () => {
    const openChat = vi.fn();
    const user = userEvent.setup();
    render(<B2bNotificationBell onOpenPivotChat={openChat} />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByRole('button', { name: /Nueva solicitud para jugar/ }));

    expect(openChat).toHaveBeenCalledWith('request-1');
  });
});