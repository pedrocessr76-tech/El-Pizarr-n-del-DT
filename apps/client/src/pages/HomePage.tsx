import React from 'react';

interface HomePageProps {
  onNavigate: (tab: 'builder' | 'history' | 'catalog' | 'bracket') => void;
  onOpenLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLogin }) => {
  return (
    <div className="bg-background text-on-background min-h-screen w-full overflow-hidden pitch-gradient relative flex flex-col justify-center items-center px-gutter transition-all duration-500">
      {/* Pitch Pattern Overlay */}
      <div className="absolute inset-0 pitch-pattern pointer-events-none opacity-50"></div>

      {/* Top Right Action */}
      <div className="absolute top-lg right-lg z-20">
        <button 
          onClick={onOpenLogin}
          className="px-6 py-3 bg-surface-container-high border border-white/10 rounded-lg text-primary font-label-md hover:bg-surface-variant transition-colors flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:text-tertiary transition-colors">login</span>
          Iniciar Sesión
        </button>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full flex flex-col justify-center items-center" id="main-content">
        {/* Branding */}
        <div className="text-center mb-xl">
          <h1 className="font-display-lg text-display-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-black tracking-tighter drop-shadow-2xl">
            FOOTBALL ELITE
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm opacity-80">
            Domina la cancha. Construye tu legado.
          </p>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-lg">
          {/* JUGAR Card */}
          <button
            onClick={() => onNavigate('builder')}
            className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center premium-hover group relative overflow-hidden h-64"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-container/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 rounded-full bg-primary-container/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px] text-primary">sports_soccer</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2 uppercase">JUGAR</h3>
            <p className="font-body-md text-body-md text-on-surface-variant/70">Entra al campo y demuestra tus habilidades estratégicas.</p>
          </button>

          {/* HISTORIAL Card */}
          <button
            onClick={() => onNavigate('history')}
            className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center premium-hover group relative overflow-hidden h-64"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-variant/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px] text-on-secondary-container">history</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2 uppercase">VER HISTORIAL DE PARTIDAS</h3>
            <p className="font-body-md text-body-md text-on-surface-variant/70">Analiza tus resultados y mejora tus tácticas futuras.</p>
          </button>

          {/* CARTAS Card */}
          <button
            onClick={() => onNavigate('catalog')}
            className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center premium-hover group relative overflow-hidden h-64"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-tertiary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-tertiary/20">
              <span className="material-symbols-outlined text-[32px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2 uppercase">VER TODAS LAS CARTAS</h3>
            <p className="font-body-md text-body-md text-on-surface-variant/70">Explora tu colección de jugadores de élite.</p>
          </button>
        </div>
      </div>
    </div>
  );
};