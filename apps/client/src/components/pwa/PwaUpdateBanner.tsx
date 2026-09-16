import React from 'react';
import { usePwaRegistration } from '../../hooks/usePwaRegistration';

export const PwaUpdateBanner: React.FC = () => {
  const { needRefresh, updateSW } = usePwaRegistration();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 items-end"
    >
      <div className="flex items-center gap-3 pr-3 pl-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md border border-[#15803d]/40 bg-[#0b1326]/95 text-[#dae2fd]">
        <span
          className="material-symbols-outlined text-2xl text-[#4ade80] shrink-0"
          aria-hidden="true"
        >
          system_update_alt
        </span>
        <div className="min-w-0">
          <p className="font-bold text-sm text-white leading-tight">Nueva actualización disponible</p>
          <p className="text-[11px] text-gray-300 leading-snug">Actualizá para ver la última versión.</p>
        </div>
        <button
          type="button"
          onClick={() => void updateSW()}
          className="shrink-0 min-h-[34px] px-4 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition-colors"
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
};