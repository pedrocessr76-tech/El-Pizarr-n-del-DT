import React from 'react';

interface HomePageProps {
  onNavigate: (tab: 'builder' | 'catalog' | 'bracket') => void;
  onOpenLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLogin }) => {
  return (
    <div className="relative min-h-[calc(100vh-73px)] w-full pitch-gradient pitch-pattern flex flex-col justify-center items-center px-6 py-12">
      {/* Branding Hero */}
      <div className="text-center max-w-3xl mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b4332] border border-[#a5d0b9]/30 text-[#a5d0b9] text-xs font-montserrat font-bold tracking-widest uppercase mb-4 shadow-lg">
          <span className="material-symbols-outlined text-sm">stars</span>
          Edición Especial Élite 2026
        </div>
        <h1 className="font-montserrat font-black text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#a5d0b9] via-[#d1e8dc] to-[#e9c349] tracking-tighter drop-shadow-2xl mb-4">
          FOOTBALL ELITE
        </h1>
        <p className="text-lg md:text-xl text-[#c1c8c2] opacity-90 max-w-xl mx-auto font-normal">
          Domina la cancha. Diseña tácticas victoriosas y construye tu legado como el DT supremo.
        </p>
      </div>

      {/* Main Actions Grid (From Stitch Screen 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* JUGAR Card */}
        <button
          onClick={() => onNavigate('builder')}
          className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center premium-hover group relative overflow-hidden h-72 border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1b4332]/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 rounded-2xl bg-[#1b4332]/60 border border-[#a5d0b9]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <span className="material-symbols-outlined text-4xl text-[#a5d0b9]">sports_soccer</span>
          </div>
          <h3 className="font-montserrat font-extrabold text-2xl text-white mb-2 tracking-wide">
            JUGAR & FORMAR
          </h3>
          <p className="text-sm text-gray-300 opacity-80 leading-relaxed">
            Entra al pizarrón táctico y arma tu 11 titular con químicas perfectas.
          </p>
        </button>

        {/* HISTORIAL Card */}
        <button
          onClick={() => onNavigate('catalog')}
          className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center premium-hover group relative overflow-hidden h-72 border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2d3449]/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 rounded-2xl bg-[#222a3d] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <span className="material-symbols-outlined text-4xl text-[#b5ccc0]">history</span>
          </div>
          <h3 className="font-montserrat font-extrabold text-2xl text-white mb-2 tracking-wide">
            VER HISTORIAL & CARTAS
          </h3>
          <p className="text-sm text-gray-300 opacity-80 leading-relaxed">
            Analiza partidas anteriores y explora tu colección de jugadores de élite.
          </p>
        </button>

        {/* COPA ELITE Card */}
        <button
          onClick={() => onNavigate('bracket')}
          className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center premium-hover group relative overflow-hidden h-72 border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#cba72f]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 rounded-2xl bg-[#2d3449] border border-[#e9c349]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <span className="material-symbols-outlined text-4xl text-[#e9c349]" style={{ fontVariationSettings: '"FILL" 1' }}>
              emoji_events
            </span>
          </div>
          <h3 className="font-montserrat font-extrabold text-2xl text-white mb-2 tracking-wide">
            COPA ÉLITE
          </h3>
          <p className="text-sm text-gray-300 opacity-80 leading-relaxed">
            Revisa el cuadro completo de eliminatorias y conquista la gloria.
          </p>
        </button>
      </div>

      {/* Footer Quick Access */}
      <div className="mt-12 text-center">
        <button
          onClick={onOpenLogin}
          className="text-xs text-gray-400 hover:text-[#a5d0b9] underline transition-colors"
        >
          ¿Tienes cuenta de DT? Inicia sesión aquí
        </button>
      </div>
    </div>
  );
};
