import { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { NotificationToast } from './components/NotificationToast';
import { useNotificationSocket } from './services/notificationService';
import { useNotificationStore } from './store/useNotificationStore';
import { useAuthStore } from './store/useAuthStore';
import { HomePage } from './pages/HomePage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';
import { CatalogHistoryPage } from './pages/CatalogHistoryPage';
import { TournamentBracketPage } from './pages/TournamentBracketPage';
import { ensureGuestToken, type AuthResponse } from './services/authService';
import { getGuestToken, hasUserToken } from './utils/session';
import { B2bApp } from './pages/B2bApp';
import { PwaOverlays } from './components/pwa/PwaOverlays';
import { MobileTopBar } from './components/layout/MobileTopBar';
import { MobileTabBar, type MobileTab } from './components/layout/MobileTabBar';

const MOBILE_TITLES: Record<ActiveTab, string> = {
  home: 'Inicio',
  builder: 'Formación y Equipo',
  catalog: 'Historial y Cartas',
  history: 'Historial y Cartas',
  bracket: 'Copa Élite',
};

const GAME_MOBILE_TABS: MobileTab<ActiveTab>[] = [
  { id: 'home', label: 'Inicio', icon: 'sports_soccer' },
  { id: 'builder', label: 'Equipo', icon: 'groups' },
  { id: 'catalog', label: 'Cartas', icon: 'style' },
  { id: 'bracket', label: 'Torneo', icon: 'emoji_events' },
];

function App() {
  const isB2bRoute = window.location.pathname.startsWith('/canchas');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  if (isB2bRoute && import.meta.env.VITE_B2B_ENABLED !== 'false') {
    return (
      <>
        <B2bApp />
        <PwaOverlays />
      </>
    );
  }

  // Suscripción única a notificaciones WebSocket para toda la app
  useNotificationSocket();
  const toasts = useNotificationStore((s) => s.toasts);
  const { user, logout } = useAuthStore();

  // Restaura la sesión desde la cookie HttpOnly (usuario real o invitado) y
  // garantiza un token efectivo en memoria desde el arranque (issue #17).
  useEffect(() => {
    void ensureGuestToken().catch((err) => console.warn('No se pudo restaurar la sesión:', err));
  }, []);

  // Hidrata el store cuando ensureGuestToken restaura un usuario real, y
  // desloguea (sin llamar al server) si la sesión venció definitivamente.
  useEffect(() => {
    const onUserSession = (e: Event) => {
      const session = (e as CustomEvent<AuthResponse>).detail;
      useAuthStore.getState().setSession(session);
    };
    const onSessionExpired = () => {
      void useAuthStore.getState().logout(false);
    };
    window.addEventListener('epdt:user-session', onUserSession);
    window.addEventListener('epdt:session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('epdt:user-session', onUserSession);
      window.removeEventListener('epdt:session-expired', onSessionExpired);
    };
  }, []);

  // Al cerrar la página con identidad de INVITADO, limpiar sus datos en backend.
  // fetch keepalive permite el header Authorization que sendBeacon no soporta.
  useEffect(() => {
    const cleanup = () => {
      if (hasUserToken()) return;
      const guestToken = getGuestToken();
      if (!guestToken) return;
      const base = (import.meta.env.VITE_API_URL as string | undefined) || '';
      fetch(`${base}/draft/data`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${guestToken}` },
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('pagehide', cleanup);
    return () => window.removeEventListener('pagehide', cleanup);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={(tab) => setActiveTab(tab)} onOpenLogin={() => setIsLoginOpen(true)} />;
      case 'builder':
        return <TeamBuilderPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'catalog':
        return <CatalogHistoryPage />;
      case 'history':
        return <CatalogHistoryPage initialView="history" />;
      case 'bracket':
        return (
          <TournamentBracketPage
            onBack={() => setActiveTab('home')}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      default:
        return <HomePage onNavigate={(tab) => setActiveTab(tab)} onOpenLogin={() => setIsLoginOpen(true)} />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-sans antialiased selection:bg-[#a5d0b9] selection:text-[#0e3727]">
        {/* Sticky Glass Navbar (desktop)*/}
        <div className="hidden md:block">
          <Navbar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        </div>

        {/* Mobile shell: fixed top bar + bottom tabs */}
        <MobileTopBar
          variant="game"
          brand="El Pizarrón del DT"
          title={MOBILE_TITLES[activeTab]}
          onBrandClick={() => setActiveTab('home')}
          actions={[
            user
              ? { icon: 'logout', label: 'Salir', onClick: logout }
              : { icon: 'login', label: 'Iniciar Sesión', onClick: () => setIsLoginOpen(true) },
            { icon: 'location_on', label: 'Canchas', onClick: () => { window.location.href = '/canchas'; } },
          ]}
        />
        <MobileTabBar
          variant="game"
          tabs={GAME_MOBILE_TABS}
          activeTab={activeTab === 'history' ? 'catalog' : activeTab}
          onSelect={(tab) => setActiveTab(tab)}
        />

        {/* Main Page Content */}
        {/* pt reserva la altura del header fijo (h-16 + safe-area del notch) para que el contenido no se superponga */}
        <main className="w-full pt-[calc(env(safe-area-inset-top,0px)+4rem)] md:pt-0 mobile-shell-pad">
          {renderActivePage()}
        </main>

        {/* Toasts en tiempo real (efímeros, apilados */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="fixed top-20 right-4 z-[70] flex flex-col-reverse gap-3 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <NotificationToast item={toast} />
            </div>
          ))}
        </div>

        {/* Login Modal Overlay*/}
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
      <PwaOverlays />
    </>
  );
}

export default App;
