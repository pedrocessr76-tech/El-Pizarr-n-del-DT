import { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';
import { CatalogHistoryPage } from './pages/CatalogHistoryPage';
import { TournamentBracketPage } from './pages/TournamentBracketPage';
import { getGuestSessionId } from './utils/session';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // Al cerrar la página/sesión de invitado, limpiar datos en backend via beacon
  useEffect(() => {
    const cleanup = () => {
      const sessionId = getGuestSessionId();
      if (!sessionId) return;
      const payload = JSON.stringify({ sessionId });
      navigator.sendBeacon('/draft/session/cleanup', new Blob([payload], { type: 'application/json' }));
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
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-sans antialiased selection:bg-[#a5d0b9] selection:text-[#0e3727]">
      {/* Sticky Glass Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Page Content */}
      <main className="w-full">
        {renderActivePage()}
      </main>

      {/* Login Modal Overlay */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

export default App;
