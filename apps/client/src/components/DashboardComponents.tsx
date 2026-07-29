import React, { useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  currentScreen?: string;
  onNavigate?: (screen: string) => void;
}

export function MainLayout({ children, currentScreen = 'dashboard', onNavigate }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Hub Principal', icon: 'dashboard' },
    { id: 'draft-room', label: 'Draft Room & Cartas', icon: 'style' },
    { id: 'formation', label: 'Elegir Formación', icon: 'schema' },
    { id: 'captain', label: 'Seleccionar Capitán', icon: 'star' },
    { id: 'bracket', label: 'Copa del DT (Bracket)', icon: 'account_tree' },
    { id: 'match-center', label: 'Torneo en Vivo', icon: 'sports_soccer' },
    { id: 'historial', label: 'Historial de Partidas', icon: 'history' },
    { id: 'tactical', label: 'Tactical Intelligence', icon: 'monitoring' },
  ];

  const getIsActive = (id: string) => {
    if (id === currentScreen) return true;
    if (id === 'bracket' && (currentScreen === 'tournament-bracket' || currentScreen === 'bracket')) return true;
    if (id === 'historial' && (currentScreen === 'historial-de-partidas' || currentScreen === 'historial')) return true;
    return false;
  };

  return (
    <div className="bg-[#111316] font-sans text-[#e2e2e6] min-h-screen flex relative">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#1e2023]/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col pt-6 pb-6 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              alt="El Pizarrón del DT Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AP1WRLt2arhaseVvop9MHRP9DiFnCDYGYTiQ-8mLBYDI4pwK1b6gEaz0N-CPHKoYou-NC-yeoW_0ld2aMbsvkUv2OF_6U33QA-1O5a67efWmV6XOg7d4Z2N5I_558aOteJR9l8SnLQWnkuOCoIj5C_uxHaP2K4zJJha3l7nC3nYCv21GFRcCAI1r95EviZLXEf0XfzZ687dzeH_dnCxtVuTV12RxMAfwuWe1KFTar6ZFKSvbiZm4G4D7XV9xCm4"
            />
            <span className="text-xl tracking-tight text-white font-extrabold">
              El Pizarrón
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = getIsActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate?.(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center px-4 py-3 rounded-xl transition-all group ${
                  active
                    ? 'bg-[#39ff14] text-[#053900] font-black shadow-[0_0_15px_-5px_#39ff14]'
                    : 'text-gray-300 hover:bg-[#333538] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined mr-3">{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 min-h-screen flex flex-col w-full min-w-0">
        {/* Header */}
        <header className="sticky top-0 h-16 bg-[#111316]/80 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center bg-[#282a2d] rounded-full px-4 py-1.5 w-64 md:w-96 border border-white/10 focus-within:border-[#00e3fd] transition-all">
              <span className="material-symbols-outlined text-gray-400 mr-2 text-sm">search</span>
              <input
                className="bg-transparent border-none outline-none text-white placeholder:text-gray-500 w-full text-xs"
                placeholder="Search tactics, players..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm text-white font-bold">Coach Javier</div>
              <div className="text-[10px] text-[#39ff14] uppercase font-bold tracking-widest">
                Head Coach
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#107100] flex items-center justify-center ring-2 ring-[#39ff14]/30">
              <span className="material-symbols-outlined text-white text-[24px]">person</span>
            </div>
          </div>
        </header>

        {/* Page Main View */}
        <main className="relative flex-1 bg-[#111316] min-h-screen flex flex-col items-center justify-center">
          {children}
        </main>
      </div>
    </div>
  );
}

// Hub Principal Component - Exact Match with Image 1 (Proportional Compact Layout)
export function DashboardScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#111316] text-white p-4 relative overflow-hidden font-sans">
      {/* Stadium Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20 scale-105 blur-[2px] pointer-events-none"
        style={{ backgroundImage: "url('/images/stadium_bg.jpg')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#111316]/80 via-[#111316]/90 to-[#111316] pointer-events-none" />

      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#39ff14]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00e3fd]/5 blur-[150px]" />
      </div>

      {/* Side Vertical Decorative Text (Image 1) */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden xl:block select-none pointer-events-none z-10">
        <span
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          className="text-[10px] uppercase tracking-[0.8em] text-gray-500/20 font-black"
        >
          MASTER THE PITCH
        </span>
      </div>
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:block select-none pointer-events-none z-10">
        <span
          style={{ writingMode: 'vertical-rl' }}
          className="text-[10px] uppercase tracking-[0.8em] text-gray-500/20 font-black"
        >
          TACTICS • PERFORMANCE • STRATEGY
        </span>
      </div>

      {/* Controlled Center Wrapper (max-w-[480px] matching Image 1) */}
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center justify-center z-10 py-4 relative">
        
        {/* Compact Logo Section (Smaller & Sleek) */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-2 bg-[#1e2023]/80 border border-white/10 rounded-2xl p-2.5 flex items-center justify-center relative shadow-lg">
            <div className="absolute inset-0 bg-[#39ff14]/15 blur-md rounded-full" />
            <img
              alt="El Pizarrón del DT"
              className="relative w-full h-full object-contain drop-shadow-[0_0_8px_rgba(57,255,20,0.35)]"
              src="https://lh3.googleusercontent.com/aida/AP1WRLt2arhaseVvop9MHRP9DiFnCDYGYTiQ-8mLBYDI4pwK1b6gEaz0N-CPHKoYou-NC-yeoW_0ld2aMbsvkUv2OF_6U33QA-1O5a67efWmV6XOg7d4Z2N5I_558aOteJR9l8SnLQWnkuOCoIj5C_uxHaP2K4zJJha3l7nC3nYCv21GFRcCAI1r95EviZLXEf0XfzZ687dzeH_dnCxtVuTV12RxMAfwuWe1KFTar6ZFKSvbiZm4G4D7XV9xCm4"
            />
          </div>
          <span className="text-[#39ff14] text-[10px] uppercase tracking-[0.25em] font-extrabold block">
            TACTICAL SUITE V2.0
          </span>
          <span className="text-white text-[10px] uppercase tracking-widest font-extrabold block mt-0.5">
            EL PIZARRÓN DEL DT
          </span>
        </div>

        {/* Action Cards Container (Enhanced Professional Aesthetics) */}
        <div className="w-full max-w-[440px] flex flex-col gap-5 mx-auto">
          
          {/* Primary Action Card: Solid Neon Green JUGAR DRAFT with Premium Rounded Borders */}
          <button
            onClick={() => onNavigate?.('formation')}
            className="group relative w-full bg-[#39ff14] hover:bg-[#79ff5b] text-[#053900] rounded-2xl px-6 py-5 border border-[#39ff14]/80 hover:border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:shadow-[0_0_40px_rgba(57,255,20,0.55)] transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-[#053900] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest mb-0.5">
                MODO COMPETITIVO
              </span>
              <span className="text-[#053900] text-xl font-black uppercase tracking-tight">
                JUGAR DRAFT
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#053900] text-[#39ff14] flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-2xl">
                sports_soccer
              </span>
            </div>
          </button>

          {/* Secondary Parallel Cards (Enlarged & Separated) */}
          <div className="grid grid-cols-2 gap-5 w-full">
            {/* Card 1: VER CARTAS DE JUGADORES */}
            <button
              onClick={() => onNavigate?.('draft-room')}
              className="group relative flex flex-col items-center justify-center bg-[#1e2023] hover:bg-[#25282d] border border-white/10 hover:border-[#39ff14]/60 rounded-2xl py-7 px-4 gap-3.5 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(57,255,20,0.15)] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#39ff14]/12 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">style</span>
              </div>
              <span className="text-white text-[11px] font-extrabold uppercase tracking-wider text-center">
                VER CARTAS DE JUGADORES
              </span>
            </button>

            {/* Card 2: HISTORIAL DE PARTIDAS */}
            <button
              onClick={() => onNavigate?.('historial')}
              className="group relative flex flex-col items-center justify-center bg-[#1e2023] hover:bg-[#25282d] border border-white/10 hover:border-[#00e3fd]/60 rounded-2xl py-7 px-4 gap-3.5 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,227,253,0.15)] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#00e3fd]/12 border border-[#00e3fd]/30 flex items-center justify-center text-[#00e3fd] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">history</span>
              </div>
              <span className="text-white text-[11px] font-extrabold uppercase tracking-wider text-center">
                HISTORIAL DE PARTIDAS
              </span>
            </button>
          </div>
        </div>

        {/* Footer Info Section */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[10px]">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 uppercase text-[9px] font-bold">SERVIDORES</span>
            <span className="text-[#39ff14] font-extrabold">Online</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-gray-400 uppercase text-[9px] font-bold">VERSIÓN</span>
            <span className="text-white font-bold">Alpha 0.8.4</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-gray-400 uppercase text-[9px] font-bold">REGIÓN</span>
            <span className="text-white font-bold">LATAM</span>
          </div>
        </div>

      </div>
    </div>
  );
}
