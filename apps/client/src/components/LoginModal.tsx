import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, isLoading, error, clearError } = useAuthStore();

  if (!isOpen) return null;

  const handleSwitchMode = () => {
    clearError();
    setValidationError(null);
    setPassword('');
    setConfirmPassword('');
    setIsRegister(!isRegister);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (isRegister) {
      // Validación de nombre de usuario
      if (email.trim().length < 3) {
        setValidationError('El nombre de usuario debe tener al menos 3 caracteres.');
        return;
      }
      // Validación de contraseña
      if (password.length < 6) {
        setValidationError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      // Validación de confirmación
      if (password !== confirmPassword) {
        setValidationError('Las contraseñas no coinciden.');
        return;
      }
    }

    const success = isRegister
      ? await register(email.trim(), password)
      : await login(email.trim(), password);
    if (success) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md transition-opacity duration-300 opacity-100">
      <div className="glass-panel rounded-2xl w-full min-w-[min(420px,100%)] max-w-lg relative p-8 shadow-2xl scale-100 transition-transform duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="font-headline-lg text-headline-lg text-white font-bold mb-2 tracking-tight uppercase">
            {isRegister ? 'Crear Cuenta' : 'Acceso Élite'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {isRegister ? 'Regístrate para comenzar tu legado.' : 'Ingresa tus credenciales para continuar.'}
          </p>
        </div>

        {(error || validationError) && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach.javier"
              required
              minLength={3}
              maxLength={20}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Mínimo 6 caracteres' : '••••••••'}
              required
              minLength={6}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-3 rounded-lg hover:bg-primary-fixed-dim transition-colors shadow-[0_0_15px_rgba(165,208,185,0.4)] uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="font-label-md text-label-md text-on-surface-variant">O continúa con</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => { alert('Google Login Simulado'); onClose(); }}
            className="flex-1 bg-surface-container-high border border-white/10 rounded-lg py-3 flex items-center justify-center hover:bg-surface-variant transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.35z"></path>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { alert('Apple Login Simulado'); onClose(); }}
            className="flex-1 bg-surface-container-high border border-white/10 rounded-lg py-3 flex items-center justify-center hover:bg-surface-variant transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-1.15 1.4-.29 2.58.07 3.53.86-1.52 1-2.12 2.61-1.63 4.14.47 1.51 1.9 2.45 3.47 2.39-1.06 3.19-2.58 5.4-3.95 5.93zm-4.32-14.7c-.12-1.63 1.12-3.21 2.75-3.58.33 1.81-1.19 3.57-2.75 3.58z"></path>
            </svg>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-sm text-on-surface-variant">
            {isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo en el cuerpo técnico?'}{' '}
            <button
              type="button"
              onClick={handleSwitchMode}
              className="text-primary font-semibold hover:underline ml-1"
            >
              {isRegister ? 'Iniciar sesión' : 'Crear una cuenta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};