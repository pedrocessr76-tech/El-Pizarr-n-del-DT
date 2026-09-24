import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from './LoginModal';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    guest: vi.fn(),
    refresh: vi.fn(),
    getProfile: vi.fn(),
  },
  ensureGuestToken: vi.fn(),
}));

const loginMock = vi.mocked(authService.login);
const registerMock = vi.mocked(authService.register);

const SESSION = { accessToken: 'user-token', user: { id: 'u1', username: 'coach' } };

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
  vi.clearAllMocks();
});

describe('LoginModal', () => {
  it('loguea con usuario y contraseña y cierra al éxito', async () => {
    loginMock.mockResolvedValue(SESSION);
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LoginModal isOpen onClose={onClose} />);
    await user.type(screen.getByPlaceholderText('coach.javier'), 'coach');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('coach', 'secreto'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().token).toBe('user-token');
  });

  it('muestra el error del servidor y no cierra', async () => {
    loginMock.mockRejectedValue({ response: { data: { message: 'Credenciales inválidas.' } } });
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LoginModal isOpen onClose={onClose} />);
    await user.type(screen.getByPlaceholderText('coach.javier'), 'coach');
    await user.type(screen.getByPlaceholderText('••••••••'), 'malo');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('en registro valida nombre de usuario corto', async () => {
    registerMock.mockResolvedValue(SESSION);
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LoginModal isOpen onClose={onClose} />);
    await user.click(screen.getByText('Crear una cuenta'));
    await user.type(screen.getByPlaceholderText('coach.javier'), 'ab');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await user.type(screen.getByPlaceholderText('••••••••'), '123456');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('El nombre de usuario debe tener al menos 3 caracteres.')).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('en registro valida que las contraseñas coincidan', async () => {
    registerMock.mockResolvedValue(SESSION);
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LoginModal isOpen onClose={onClose} />);
    await user.click(screen.getByText('Crear una cuenta'));
    await user.type(screen.getByPlaceholderText('coach.javier'), 'coach');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await user.type(screen.getByPlaceholderText('••••••••'), '654321');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('registra correctamente y cierra', async () => {
    registerMock.mockResolvedValue(SESSION);
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LoginModal isOpen onClose={onClose} />);
    await user.click(screen.getByText('Crear una cuenta'));
    await user.type(screen.getByPlaceholderText('coach.javier'), 'coach');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await user.type(screen.getByPlaceholderText('••••••••'), '123456');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith('coach', '123456'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('vuelve al modo login desde registro', async () => {
    const user = userEvent.setup();

    render(<LoginModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByText('Crear una cuenta'));
    expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();

    await user.click(screen.getByText('Iniciar sesión'));
    expect(screen.getByText('Acceso Élite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});