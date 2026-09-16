import React from 'react';
import { usePwaRegistration } from '../../hooks/usePwaRegistration';

export const PwaInstallButton: React.FC = () => {
  const { canInstall, promptInstall, dismissInstall } = usePwaRegistration();

  if (!canInstall) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[80] flex items-center gap-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md border border-[#15803d]/40 bg-[#0b1326]/95 text-[#dae2fd] pl-4 pr-2 py-3"
    >
      <span className="material-symbols-outlined text-2xl text-[#4ade80] shrink-0" aria-hidden="true">
        install_desktop
      </span>
      <div className="min-w-0">
        <p className="font-bold text-sm text-white leading-tight">Instalar aplicación</p>
        <p className="text-[11px] text-gray-300 leading-snug">Usala como una app nativa.</p>
      </div>
      <button
        type="button"
        onClick={() => void promptInstall()}
        className="shrink-0 min-h-[34px] px-4 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition-colors"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={dismissInstall}
        aria-label="Cerrar aviso de instalación"
        className="shrink-0 p-1.5 text-gray-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};