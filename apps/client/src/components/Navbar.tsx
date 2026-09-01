import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationBell } from './NotificationBell';

export type ActiveTab = 'home' | 'builder' | 'catalog' | 'bracket' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenLogin }) => {
  const { user, logout } = useAuthStore();
  const navItems: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Inicio', icon: 'home' },
    { id: 'builder', label: 'Formación y Equipo', icon: 'tactics' },
    { id: 'catalog', label: 'Historial y Cartas', icon: 'style' },
    { id: 'bracket', label: 'Copa Élite', icon: 'emoji_events' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1b4332] border border-[#a5d0b9]/30 flex items-center justify-center shadow-[0_0_15px_rgba(27,67,50,0.5)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[#a5d0b9] text-2xl">sports_soccer</span>
          </div>
          <div>
            <h1 className="font-montserrat font-black text-lg tracking-tight text-white leading-none">
              FOOTBALL <span className="text-[#a5d0b9]">ELITE</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">El Pizarrón del DT</p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#131b2e] p-1.5 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1b4332] text-[#a5d0b9] font-semibold border border-[#a5d0b9]/30 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1b4332] border border-[#a5d0b9]/30 rounded-lg text-sm font-montserrat font-semibold text-[#a5d0b9]">
                <span className="material-symbols-outlined text-lg">account_circle</span>
                <span className="max-w-[120px] truncate">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 bg-[#222a3d] border border-white/10 rounded-lg text-sm font-montserrat font-semibold text-gray-400 hover:text-white hover:bg-[#2d3449] transition-colors shadow-sm"
                title="Cerrar sesión"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 bg-[#222a3d] border border-white/10 rounded-lg text-sm font-montserrat font-semibold text-[#a5d0b9] hover:bg-[#2d3449] hover:border-[#a5d0b9]/40 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
