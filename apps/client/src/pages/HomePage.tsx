import React from 'react';
import { useDraftStore } from '../store/useDraftStore';

interface HomePageProps {
  onNavigate: (tab: 'builder' | 'history' | 'catalog' | 'bracket') => void;
  onOpenLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLogin }) => {
  const team = useDraftStore((s) => s.team);
  const formation = useDraftStore((s) => s.formation);
  const squadSize = team.length;
  const avgRating = squadSize > 0
    ? Math.round(team.reduce((sum, player) => sum + (player.rating ?? 0), 0) / squadSize)
    : 0;

  return (
    <div className="bg-background text-on-background min-h-screen w-full overflow-hidden pitch-gradient relative flex flex-col justify-start md:justify-center items-center px-gutter py-lg md:py-0 transition-all duration-500">
      {/* Pitch Pattern Overlay */}
      <div className="absolute inset-0 pitch-pattern pointer-events-none opacity-50"></div>

      {/* Top Right Action (desktop) */}
      <div className="hidden md:block absolute top-lg right-lg z-20">
        <button
          onClick={onOpenLogin}
          className="px-6 py-3 bg-surface-container-high border border-white/10 rounded-lg text-primary font-label-md hover:bg-surface-variant transition-colors flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:text-tertiary transition-colors">login</span>
          Iniciar Sesión
        </button>
      </div>

      {/* ===== Mobile layout ===== */}
      <div className="relative z-10 w-full max-w-md flex flex-col gap-4 md:hidden" id="main-content-mobile">
        {/* Branding hero */}
        <div className="flex flex-col items-center text-center pt-2 pb-1 gap-2.5">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(165,208,185,0.25)]">
            <span className="material-symbols-outlined text-[44px] text-primary">sports_soccer</span>
          </div>
          <h1 className="font-display-lg text-[28px] leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-black tracking-tighter">
            EL PIZARRÓN
          </h1>
        </div>

        {/* Acciones principales: 3 tarjetas apiladas */}
        <div className="flex flex-col gap-3">
          {/* Jugar Partido */}
          <button
            onClick={() => onNavigate('builder')}
            className="w-full rounded-2xl bg-primary-container text-[#dff2e6] border border-primary/30 px-4 py-5 flex items-center gap-4 shadow-lg shadow-black/25 active:scale-[0.98] transition-all text-left"
          >
            <span className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">sports_soccer</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-headline-md text-[17px] font-black uppercase tracking-wide leading-tight">Jugar Partido</span>
              <span className="block font-label-md text-[11px] text-primary/80 mt-1">Enfrentate en el torneo Élite</span>
            </span>
            <span className="material-symbols-outlined text-[24px] shrink-0">arrow_forward</span>
          </button>

          {/* Ver Historial */}
          <button
            onClick={() => onNavigate('history')}
            className="w-full rounded-2xl bg-surface-container-high border border-white/10 px-4 py-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all text-left"
          >
            <span className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px] text-secondary">history</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-headline-sm text-[15px] font-bold uppercase tracking-wide leading-tight text-on-surface">Ver Historial</span>
              <span className="block font-label-md text-[11px] text-on-surface-variant mt-1">Revisa tus últimos partidos</span>
            </span>
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant shrink-0">chevron_right</span>
          </button>

          {/* Ver Catálogo de Cartas */}
          <button
            onClick={() => onNavigate('catalog')}
            className="w-full rounded-2xl bg-surface-container-high border border-white/10 px-4 py-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all text-left"
          >
            <span className="w-12 h-12 rounded-xl bg-tertiary/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px] text-tertiary">style</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-headline-sm text-[15px] font-bold uppercase tracking-wide leading-tight text-on-surface">Ver Catálogo de Cartas</span>
              <span className="block font-label-md text-[11px] text-on-surface-variant mt-1">Explora tu colección de jugadores</span>
            </span>
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant shrink-0">chevron_right</span>
          </button>
        </div>

        {/* Squad summary (solo se muestra si hay plantilla guardada) */}
        {squadSize > 0 && (
          <div className="bg-surface-container-low rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-secondary"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">shield</span>
                </div>
                <div className="min-w-0">
                  <span className="block font-headline-sm text-[16px] font-bold text-on-surface truncate">Mi Plantilla</span>
                  <span className="font-label-md text-on-surface-variant text-[11px]">Plantilla Principal</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-md shrink-0">
                <span className="font-label-md text-[10px] text-on-surface-variant font-semibold">ESQ:</span>
                <span className="font-label-md text-[10px] text-primary font-bold">{formation}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center bg-surface-container-high p-3 rounded-lg">
                <span className="font-label-md text-[10px] text-on-surface-variant uppercase">Media</span>
                <span className="font-stat-value text-secondary text-[24px]">{avgRating}</span>
                <span className="font-label-md text-[10px] text-secondary/70">OVR</span>
              </div>
              <div className="flex flex-col items-center bg-surface-container-high p-3 rounded-lg">
                <span className="font-label-md text-[10px] text-on-surface-variant uppercase">Jugadores</span>
                <span className="font-stat-value text-primary text-[24px]">{squadSize}</span>
                <span className="font-label-md text-[10px] text-primary/70">/ 18</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('builder')}
              className="w-full mt-3 bg-surface-container-high/60 active:bg-surface-container-high text-primary flex items-center justify-center gap-1.5 py-3 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">schema</span>
              <span className="font-label-md text-[11px] font-bold uppercase tracking-wider">Ajustar Táctica y Suplentes</span>
            </button>
          </div>
        )}

      </div>

      {/* ===== Desktop layout ===== */}
      <div className="relative z-10 w-full hidden md:flex flex-col justify-center items-center" id="main-content">
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
