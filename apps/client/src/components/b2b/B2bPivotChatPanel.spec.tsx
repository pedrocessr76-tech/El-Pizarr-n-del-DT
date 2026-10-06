import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { B2bPivotChatPanel } from './B2bPivotChatPanel';
import { b2bService } from '../../services/b2bService';
import { useB2bStore } from '../../store/useB2bStore';

beforeEach(() => {
  vi.spyOn(b2bService, 'getPivotChat').mockResolvedValue({
    id: 'request-1',
    isPivot: true,
    messages: [{
      id: 'message-1', conversationId: 'request-1', senderUserId: 'requester',
      body: '¿Podés jugar el jueves?', createdAt: '2030-01-01T12:00:00.000Z',
    }],
  });
  vi.spyOn(b2bService, 'sendPivotChatMessage').mockResolvedValue({
    id: 'message-2', conversationId: 'request-1', senderUserId: 'pivot',
    body: 'Sí, puedo.', createdAt: '2030-01-01T12:01:00.000Z',
  });
  useB2bStore.setState({ user: { userId: 'pivot' } as never });
});

describe('B2bPivotChatPanel', () => {
  it('muestra alias y mensajes en vivo sin mostrar datos de contacto', async () => {
    render(<B2bPivotChatPanel conversationId="request-1" onClose={vi.fn()} />);

    expect(await screen.findByText('¿Podés jugar el jueves?')).toBeInTheDocument();
    expect(screen.getAllByText('Jugador interesado')).toHaveLength(2);
    act(() => window.dispatchEvent(new CustomEvent('b2b-pivot-chat-message', { detail: {
      id: 'message-live', conversationId: 'request-1', senderUserId: 'requester',
      body: 'El partido empieza a las 20.', createdAt: '2030-01-01T12:02:00.000Z',
    } })));

    expect(await screen.findByText('El partido empieza a las 20.')).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+\d{7}/)).not.toBeInTheDocument();
  });

  it('envía la respuesta por la conversación abierta', async () => {
    const user = userEvent.setup();
    render(<B2bPivotChatPanel conversationId="request-1" onClose={vi.fn()} />);

    await user.type(await screen.findByRole('textbox', { name: 'Mensaje' }), 'Sí, puedo.');
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(b2bService.sendPivotChatMessage).toHaveBeenCalledWith('request-1', 'Sí, puedo.');
    expect(await screen.findByText('Sí, puedo.')).toBeInTheDocument();
  });
});