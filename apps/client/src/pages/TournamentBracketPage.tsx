import React, { useState, useEffect } from 'react';
import type { Match } from '../../../../packages/shared/types/models';
import { matchService } from '../services/matchService';
import { useAuthStore } from '../store/useAuthStore';
import { useDraftStore } from '../store/useDraftStore';

interface TournamentBracketPageProps {
  onBack?: () => void;
}

export const TournamentBracketPage: React.FC<TournamentBracketPageProps> = ({ onBack }) => {
  const [showLiveMatchModal, setShowLiveMatchModal] = useState<boolean>(false);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Record<string, Match[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { teamId } = useDraftStore();

  useEffect(() => {
    createTournamentIfNeeded();
  }, [teamId]);

  const createTournamentIfNeeded = async () => {
    if (!teamId) {
      setMatchError('Primero debes crear un equipo en Formación y Equipo.');
      return;
    }
    if (tournamentId) return;
    setIsLoading(true);
    setMatchError(null);
    try {
      const tournament = await matchService.createTournament(teamId, user?.id);
      setTournamentId(tournament.id);
      const matches = tournament.rounds.OCTAVOS || [];
      setRounds({ OCTAVOS: matches });
    } catch (err: any) {
      setMatchError(err.response?.data?.message || 'Error al crear el torneo. Verifica el backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateMatch = async (matchId: string) => {
    setIsLoading(true);
    setMatchError(null);
    try {
      const result = await matchService.simulateMatch(matchId);
      setRounds((prev) => {
        const currentOctavos = prev.OCTAVOS || [];
        const updated = currentOctavos.map((m) => (m.id === matchId ? result : m));
        return { ...prev, OCTAVOS: updated };
      });
    } catch (err: any) {
      setMatchError(err.response?.data?.message || 'Error al simular el partido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface h-screen w-screen flex flex-col antialiased relative pitch-bg pitch-lines overflow-hidden">
      {/* Header */}
      <header className="w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-lg shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-label-md text-label-md tracking-wider">VOLVER</span>
        </button>
        <div className="text-headline-md font-headline-md font-extrabold text-primary tracking-tighter uppercase">
          COPA ÉLITE
        </div>
        <div className="w-[88px]"></div>
      </header>

      {/* Main Bracket Canvas Container */}
      <div className="flex-1 overflow-auto relative p-xl pb-32">
        <div className="min-w-[1200px] h-[900px] relative flex justify-between items-center px-16">
          {/* Stage 1: Octavos de Final */}
          <div className="flex flex-col justify-around h-full w-[280px] z-10 relative">
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/60 backdrop-blur-sm rounded-xl">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
              </div>
            )}
            {matchError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs mb-2">
                {matchError}
              </div>
            )}
            {!isLoading && (rounds.OCTAVOS || []).map((match, idx) => {
              const homeName = match.homeTeam?.name || `Equipo ${idx * 2 + 1}`;
              const awayName = match.awayTeam?.name || `Equipo ${idx * 2 + 2}`;
              const isUserMatch = match.homeTeam?.id === teamId || match.awayTeam?.id === teamId;
              const isFinished = match.status === 'FINISHED';
              return (
                <div
                  key={match.id}
                  className={`rounded-xl p-4 flex flex-col gap-2 relative z-10 ${
                    isUserMatch
                      ? 'bg-surface-container-high border-2 border-primary shadow-[0_0_30px_-5px_rgba(165,208,185,0.4)] transform scale-105'
                      : 'bg-surface-container-high border border-white/10 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {isUserMatch && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-3 py-0.5 rounded-full font-label-md text-xs uppercase tracking-widest font-bold z-20">Tu Partido</div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isUserMatch ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface'}`}>
                        {homeName.substring(0, 2).toUpperCase()}
                      </span>
                      <span className={`font-label-md text-label-md truncate max-w-[120px] ${isUserMatch ? 'text-tertiary' : 'text-on-surface'}`}>{homeName}</span>
                    </div>
                    <span className={`font-stat-value text-stat-value ${isFinished ? 'text-on-surface' : 'text-on-surface-variant opacity-60'}`}>{isFinished ? match.homeScore : '-'}</span>
                  </div>
                  <div className="h-px bg-surface-variant w-full"></div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px]">
                        {awayName.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface truncate max-w-[120px]">{awayName}</span>
                    </div>
                    <span className={`font-stat-value text-stat-value ${isFinished ? 'text-on-surface' : 'text-on-surface-variant opacity-60'}`}>{isFinished ? match.awayScore : '-'}</span>
                  </div>
                  {isUserMatch && !isFinished && (
                    <button
                      onClick={() => handleSimulateMatch(match.id)}
                      disabled={isLoading}
                      className="w-full bg-primary-container border border-primary text-primary hover:bg-primary hover:text-on-primary font-headline-sm text-sm uppercase py-3 rounded-lg transition-all shadow-lg disabled:opacity-50"
                    >
                      JUGAR PARTIDO
                    </button>
                  )}
                  {isUserMatch && isFinished && (
                    <button
                      onClick={() => setShowLiveMatchModal(true)}
                      className="w-full bg-surface-container border border-white/10 text-on-surface font-headline-sm text-sm uppercase py-3 rounded-lg transition-all shadow-lg hover:bg-surface-variant"
                    >
                      VER REPETICIÓN
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage 2: Semifinales */}
          <div className="flex flex-col justify-around h-[75%] w-[280px] z-10 relative">
            {/* SF 1 */}
            <div className="bg-surface-container-low rounded-xl border border-white/5 shadow-lg p-4 flex flex-col gap-2 relative opacity-80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px]">RD</span>
                  <span className="font-label-md text-label-md text-on-surface">Red Devils FC</span>
                </div>
                <span className="font-stat-value text-stat-value text-on-surface">-</span>
              </div>
              <div className="h-px bg-surface-variant w-full"></div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">hourglass_empty</span>
                  <span className="font-label-md text-label-md text-on-surface-variant italic">Por definir</span>
                </div>
                <span className="font-stat-value text-stat-value text-on-surface-variant">-</span>
              </div>
            </div>

            {/* SF 2 */}
            <div className="bg-surface-container-low rounded-xl border border-white/5 shadow-lg p-4 flex flex-col gap-2 relative opacity-80">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px]">MC</span>
                  <span className="font-label-md text-label-md text-on-surface">Metro City</span>
                </div>
                <span className="font-stat-value text-stat-value text-on-surface">-</span>
              </div>
              <div className="h-px bg-surface-variant w-full"></div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px]">GL</span>
                  <span className="font-label-md text-label-md text-on-surface">Golden Lions</span>
                </div>
                <span className="font-stat-value text-stat-value text-on-surface">-</span>
              </div>
            </div>
          </div>

          {/* Stage 3: La Gran Final */}
          <div className="flex flex-col justify-center h-full w-[320px] z-10 relative">
            <div className="bg-surface-container-high rounded-xl border-2 border-tertiary/30 shadow-[0_20px_40px_-5px_rgba(233,195,73,0.15)] p-6 flex flex-col gap-6 relative z-10 backdrop-blur-md">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="material-symbols-outlined text-[48px] text-tertiary drop-shadow-[0_0_15px_rgba(233,195,73,0.5)]">trophy</span>
                <span className="text-headline-sm text-sm uppercase tracking-widest text-tertiary mt-2 whitespace-nowrap">LA GRAN FINAL</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex flex-col items-center gap-3 w-[45%]">
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center border-2 border-dashed border-white/20">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant">help</span>
                  </div>
                  <span className="font-label-md text-xs text-center text-on-surface-variant">Ganador SF1</span>
                </div>
                <div className="font-headline-md text-headline-md text-on-surface-variant opacity-50 shrink-0">VS</div>
                <div className="flex flex-col items-center gap-3 w-[45%]">
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center border-2 border-dashed border-white/20">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant">help</span>
                  </div>
                  <span className="font-label-md text-xs text-center text-on-surface-variant">Ganador SF2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Match Modal */}
      {showLiveMatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setShowLiveMatchModal(false)}></div>
          <div className="relative w-full max-w-5xl h-[85vh] bg-surface-container rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-surface-container-high border-b border-white/10 p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary animate-pulse">sensors</span>
                <span className="font-label-md text-primary tracking-widest uppercase">EN VIVO - 65'</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="font-headline-sm text-tertiary">PRO SCOUT XI</span>
                <div className="bg-surface-variant px-6 py-2 rounded-lg border border-white/5">
                  <span className="font-display-lg text-4xl text-on-surface">2 - 1</span>
                </div>
                <span className="font-headline-sm text-on-surface">Yellow Jackets</span>
              </div>
              <button onClick={() => setShowLiveMatchModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 p-6 flex items-center justify-center border-r border-white/10 bg-surface-dim relative">
                <div className="w-full max-w-lg aspect-[2/3] pitch-bg rounded-xl relative border border-white/20 shadow-2xl overflow-hidden">
                  {/* Internal pitch lines */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-white/30"></div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/30"></div>
                </div>
              </div>
              <div className="w-96 flex flex-col bg-surface-container p-6 overflow-y-auto">
                <h4 className="font-headline-sm text-on-surface mb-4">Comentarios</h4>
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <span className="font-stat-value text-primary">65'</span>
                      <p className="font-body-md text-on-surface-variant">¡GOL DE PRO SCOUT XI! Remate implacable.</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
