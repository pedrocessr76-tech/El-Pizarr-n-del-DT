import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { B2bEmailVerification } from './B2bEmailVerification';
import { useB2bStore } from '../store/useB2bStore';

vi.mock('../services/b2bService', () => ({
  b2bService: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
  setB2bAccessToken: vi.fn(),
}));

const { b2bService } = await import('../services/b2bService');
const verifyMock = vi.mocked(b2bService.verifyEmail);
const resendMock = vi.mocked(b2bService.resendVerification);

function renderWithToken(token: string | null) {
  window.history.replaceState({}, '', token ? `/canchas/verificar-email?token=${token}` : '/canchas/verificar-email');
  return render(<B2bEmailVerification />);
}

beforeEach(() => {
  vi.clearAllMocks();
  useB2bStore.setState({ user: null, token: null, pendingVerificationEmail: null, error: null });
});

describe('B2bEmailVerification', () => {
  it('canjea el token de la URL y confirma', async () => {
    verifyMock.mockResolvedValue({ verified: true, message: 'Email verificado. Ya podés entrar.' });

    renderWithToken('tok-123');

    await waitFor(() => expect(verifyMock).toHaveBeenCalledWith('tok-123'));
    await waitFor(() => expect(screen.getByText('¡Email verificado!')).toBeTruthy());
  });

  it('saca el token de la URL para que no quede en el historial', async () => {
    verifyMock.mockResolvedValue({ verified: true, message: 'Listo.' });

    renderWithToken('tok-123');

    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('no canjea dos veces si el componente se monta de nuevo (token de un solo uso)', async () => {
    verifyMock.mockResolvedValue({ verified: true, message: 'Listo.' });

    const { unmount } = renderWithToken('tok-123');
    await waitFor(() => expect(verifyMock).toHaveBeenCalledTimes(1));
    unmount();
    render(<B2bEmailVerification />);

    await waitFor(() => expect(verifyMock).toHaveBeenCalledTimes(1));
  });

  it('sin token en la URL no llama al servidor y ofrece reenviar', async () => {
    renderWithToken(null);

    await waitFor(() => expect(screen.getByText('No pudimos verificar')).toBeTruthy());
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('muestra el motivo que devuelve el servidor (vencido) y reenvía', async () => {
    // El store traduce el rechazo del server; la pantalla muestra su mensaje.
    verifyMock.mockRejectedValue({ response: { status: 400, data: { message: 'El enlace venció. Pedí uno nuevo.' } } });
    resendMock.mockResolvedValue({ message: 'Si la cuenta existe, te enviamos un enlace nuevo.' });

    const user = userEvent.setup();
    renderWithToken('viejo');

    await waitFor(() => expect(screen.getByText('El enlace venció. Pedí uno nuevo.')).toBeTruthy());
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@club.com');
    await user.click(screen.getByRole('button', { name: 'Reenviar el enlace' }));

    await waitFor(() => expect(resendMock).toHaveBeenCalledWith('ana@club.com'));
  });

  it('arranca el reenvío con el email pendiente si el store ya lo conoce', async () => {
    useB2bStore.setState({ pendingVerificationEmail: 'ana@club.com' });
    verifyMock.mockRejectedValue({ response: { status: 400, data: { message: 'No pudimos verificar.' } } });
    resendMock.mockResolvedValue({ message: 'Enlace enviado.' });

    const user = userEvent.setup();
    renderWithToken('viejo');

    await waitFor(() => expect(screen.getByDisplayValue('ana@club.com')).toBeTruthy());
    await user.click(screen.getByRole('button', { name: 'Reenviar el enlace' }));

    await waitFor(() => expect(resendMock).toHaveBeenCalledWith('ana@club.com'));
  });
});