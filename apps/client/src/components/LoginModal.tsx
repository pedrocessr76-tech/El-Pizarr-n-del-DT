import React, { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Sesión iniciada exitosamente con ${email}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1326]/75 backdrop-blur-md transition-opacity duration-300">
      <div className="glass-panel rounded-2xl w-full max-w-md relative p-8 shadow-2xl border border-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="font-montserrat text-2xl font-bold text-white mb-2 tracking-tight">Acceso Élite</h2>
          <p className="text-sm text-gray-400">Ingresa tus credenciales para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full bg-[#060e20] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#a5d0b9] focus:ring-1 focus:ring-[#a5d0b9] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#060e20] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#a5d0b9] focus:ring-1 focus:ring-[#a5d0b9] transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#a5d0b9] text-[#0e3727] font-montserrat font-bold py-3 rounded-lg hover:bg-[#c1ecd4] transition-colors shadow-[0_0_15px_rgba(165,208,185,0.4)]"
            >
              Entrar
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-400 font-medium">O continúa con</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => { alert('Google Login Simulado'); onClose(); }}
            className="flex-1 bg-[#222a3d] border border-white/10 rounded-lg py-2.5 flex items-center justify-center hover:bg-[#2d3449] transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { alert('Apple Login Simulado'); onClose(); }}
            className="flex-1 bg-[#222a3d] border border-white/10 rounded-lg py-2.5 flex items-center justify-center hover:bg-[#2d3449] transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-1.15 1.4-.29 2.58.07 3.53.86-1.52 1-2.12 2.61-1.63 4.14.47 1.51 1.9 2.45 3.47 2.39-1.06 3.19-2.58 5.4-3.95 5.93zm-4.32-14.7c-.12-1.63 1.12-3.21 2.75-3.58.33 1.81-1.19 3.57-2.75 3.58z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
