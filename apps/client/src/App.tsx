import { useState } from 'react';
import { MainLayout } from './components/DashboardComponents';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardComponents';
import { MatchCenterScreen } from './components/MatchCenterScreen';
import { HistorialScreen } from './components/HistorialScreen';
import { DraftRoomScreen } from './components/DraftRoomScreen';
import { BracketScreen } from './components/BracketScreen';
import { TacticalIntelligenceScreen } from './components/TacticalIntelligenceScreen';
import { FormationScreen } from './components/FormationScreen';
import { CaptainScreen } from './components/CaptainScreen';
import { DifficultyScreen } from './components/DifficultyScreen';

export type Screen =
  | 'dashboard'
  | 'match-center'
  | 'historial'
  | 'draft-room'
  | 'bracket'
  | 'tactical'
  | 'formation'
  | 'captain'
  | 'difficulty';

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  if (!username) {
    return <LoginScreen onLogin={setUsername} />;
  }

  const handleNavigate = (rawScreen: string) => {
    let targetScreen: Screen = 'dashboard';
    if (rawScreen === 'dashboard') targetScreen = 'dashboard';
    else if (rawScreen === 'match-center' || rawScreen === 'live-tournament') targetScreen = 'match-center';
    else if (rawScreen === 'historial' || rawScreen === 'historial-de-partidas') targetScreen = 'historial';
    else if (rawScreen === 'draft-room') targetScreen = 'draft-room';
    else if (rawScreen === 'bracket' || rawScreen === 'tournament-bracket') targetScreen = 'bracket';
    else if (rawScreen === 'tactical' || rawScreen === 'perfil') targetScreen = 'tactical';
    else if (rawScreen === 'formation') targetScreen = 'formation';
    else if (rawScreen === 'captain') targetScreen = 'captain';
    else if (rawScreen === 'difficulty') targetScreen = 'difficulty';

    setCurrentScreen(targetScreen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={() => handleNavigate('formation')} />;
      case 'formation':
        return <FormationScreen onNext={() => handleNavigate('draft-room')} />;
      case 'draft-room':
        return <DraftRoomScreen onNext={() => handleNavigate('captain')} />;
      case 'captain':
        return <CaptainScreen onNext={() => handleNavigate('difficulty')} />;
      case 'difficulty':
        return <DifficultyScreen onStartTournament={() => handleNavigate('bracket')} />;
      case 'bracket':
        return <BracketScreen />;
      case 'match-center':
        return <MatchCenterScreen />;
      case 'historial':
        return <HistorialScreen />;
      case 'tactical':
        return <TacticalIntelligenceScreen />;
      default:
        return <DashboardScreen onNavigate={() => handleNavigate('formation')} />;
    }
  };

  return (
    <MainLayout currentScreen={currentScreen} onNavigate={handleNavigate}>
      {renderScreen()}
    </MainLayout>
  );
}

export default App;
