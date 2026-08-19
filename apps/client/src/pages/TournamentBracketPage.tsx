import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Match, RoundName, Team, Tournament } from '../../../../packages/shared/types/models';
import type { ActiveTab } from '../components/Navbar';
import { matchService } from '../services/matchService';
import { useAuthStore } from '../store/useAuthStore';
import { useDraftStore } from '../store/useDraftStore';
import { getGuestSessionId } from '../utils/session';
import { LiveMatchOverlay } from '../components/LiveMatchOverlay';
import { DefeatOverlay } from '../components/DefeatOverlay';

interface TournamentBracketPageProps {
  onBack?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

interface RoundColumn {
  key: RoundName;
  label: string;
  count: number;
}

const ROUND_COLUMNS: RoundColumn[] = [
  { key: 'OCTAVOS', label: 'Octavos de Final', count: 8 },
  { key: 'CUARTOS', label: 'Cuartos de Final', count: 4 },
  { key: 'SEMIS', label: 'Semifinales', count: 2 },
  { key: 'FINAL', label: 'La Gran Final', count: 1 },
];

const ALL_ROUND_KEYS: RoundName[] = ['OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];

const emptyRounds = (): Record<RoundName, Match[]> => ({
  OCTAVOS: [],
  CUARTOS: [],
  SEMIS: [],
  FINAL: [],
});

const normalizeRounds = (rounds?: Record<string, Match[]> | Record<RoundName, Match[]>): Record<RoundName, Match[]> => {
  const result = emptyRounds();
  if (!rounds) return result;
  ALL_ROUND_KEYS.forEach((key) => {
    result[key] = (rounds as Record<string, Match[]>)[key] || [];
  });
  return result;
};

const getTeamInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getErrorMessage = (err: any, fallback: string): string => {
  return err?.response?.data?.message || err?.message || fallback;
};

export const TournamentBracketPage: React.FC<TournamentBracketPageProps> = ({ onBack, onNavigate }) => {
  const { user } = useAuthStore();
  const teamId = useDraftStore((s) => s.teamId);
  const tournament = useDraftStore((s) => s.tournament);
  const setTournament = useDraftStore((s) => s.setTournament);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [showDefeat, setShowDefeat] = useState<boolean>(false);
  const initRef = useRef<string | null>(null);

  const rounds = useMemo(() => (tournament ? normalizeRounds(tournament.rounds) : emptyRounds()), [tournament]);

  // Crear o refrescar el torneo una sola vez por equipo.
  useEffect(() => {
    if (!teamId) {
      setError('Primero debes crear un equipo en Formación y Equipo.');
      return;
    }
    if (initRef.current === teamId) return;
    initRef.current = teamId;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        if (tournament) {
          const refreshed = await matchService.getTournament(tournament.id);
          setTournament({ ...refreshed, rounds: normalizeRounds(refreshed.rounds) });
        } else {
          const sessionId = !user ? getGuestSessionId() ?? undefined : undefined;
          const created = await matchService.createTournament(teamId, user?.id, sessionId);
          setTournament({ ...created, rounds: normalizeRounds(created.rounds) });
        }
      } catch (err: any) {
        if (tournament) {
          // El torneo guardado ya no existe → crear uno nuevo limpio (el backend limpia residuales).
          try {
            const sessionId = !user ? getGuestSessionId() ?? undefined : undefined;
            const created = await matchService.createTournament(teamId, user?.id, sessionId);
            setTournament({ ...created, rounds: normalizeRounds(created.rounds) });
          } catch (err2: any) {
            setError(getErrorMessage(err2, 'Error al iniciar el torneo. Verifica el backend.'));
          }
        } else {
          setError(getErrorMessage(err, 'Error al iniciar el torneo. Verifica el backend.'));
        }
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const replaceMatchInRounds = (t: Tournament, updated: Match): Tournament => {
    const next = normalizeRounds(t.rounds);
    ALL_ROUND_KEYS.forEach((key) => {
      next[key] = next[key].map((m) => (m.id === updated.id ? updated : m));
    });
    return { ...t, rounds: next };
  };

  const handleStartMatch = async (match: Match) => {
    setIsLoading(true);
    setError(null);
    try {
      const finished = await matchService.simulateMatch(match.id);
      if (tournament) setTournament(replaceMatchInRounds(tournament, finished));
      setActiveMatch(finished);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al simular el partido.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvance = async () => {
    if (!tournament) return;
    setIsAdvancing(true);
    setError(null);
    try {
      const updated = await matchService.advanceTournament(tournament.id);
      setTournament({ ...updated, rounds: normalizeRounds(updated.rounds) });
      setActiveMatch(null);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al avanzar la llave.'));
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleLose = async () => {
    setActiveMatch(null);
    setShowDefeat(true);
    if (tournament) {
      try {
        await matchService.completeTournament(tournament.id);
      } catch {
        /* best-effort: guardar el torneo como finalizado en el historial */
      }
    }
  };

  const handleGoHome = () => {
    setShowDefeat(false);
    setActiveMatch(null);
    setTournament(null); // limpiar estado local del torneo
    onNavigate?.('home');
  };

  const handleReset = async () => {
    if (!teamId) return;
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = !user ? getGuestSessionId() ?? undefined : undefined;
      const created = await matchService.createTournament(teamId, user?.id, sessionId);
      setTournament({ ...created, rounds: normalizeRounds(created.rounds) });
      setActiveMatch(null);
      setShowDefeat(false);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al reiniciar el torneo.'));
    } finally {
      setIsLoading(false);
    }
  };

  const userWonMatch = (m: Match): boolean => m.winnerId === teamId;

  const renderTeamRow = (
    team: Team | undefined,
    score: number | null,
    opts: { isUser: boolean; isWinner: boolean; fallback: string },
  ) => {
    const name = team?.name || opts.fallback;
    return (
      <div className="flex justify-between items-center gap-2 w-full">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              opts.isUser ? 'bg-tertiary text-on-tertiary' : opts.isWinner ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'
            }`}
          >
            {getTeamInitials(name)}
          </span>
          <span
            className={`font-label-md text-label-md truncate ${
              opts.isWinner ? 'text-tertiary font-bold' : opts.isUser ? 'text-tertiary' : 'text-on-surface'
            }`}
          >
            {name}
          </span>
          {opts.isWinner && (
            <span className="material-symbols-outlined text-[14px] text-tertiary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              military_tech
            </span>
          )}
        </div>
        <span className={`font-stat-value text-stat-value shrink-0 ${score !== null ? 'text-on-surface' : 'text-on-surface-variant opacity-60'}`}>
          {score !== null ? score : '-'}
        </span>
      </div>
    );
  };

  const renderMatchCard = (match: Match | undefined, roundKey: RoundName, slotIdx: number) => {
    if (!match) {
      return (
        <div className="w-[248px] rounded-xl border border-dashed border-white/15 bg-surface-container-low px-4 py-3 flex flex-col gap-2 opacity-70">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-xs text-on-surface-variant italic">Por definir</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">hourglass_empty</span>
          </div>
          <div className="h-px bg-white/10 w-full"></div>
          <div className="flex justify-between items-center">
            <span className="font-label-md text-xs text-on-surface-variant italic">Por definir</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">hourglass_empty</span>
          </div>
        </div>
      );
    }

    const isUserMatch = match.homeTeam?.id === teamId || match.awayTeam?.id === teamId;
    const isFinished = match.status === 'FINISHED';
    const isCurrentRound = tournament?.currentRound === roundKey;
    const isFinalRound = roundKey === 'FINAL';
    const isChampion = tournament?.status === 'COMPLETED' && userWonMatch(match);
    const homeWon = isFinished && match.winnerId === match.homeTeam?.id;
    const awayWon = isFinished && match.winnerId === match.awayTeam?.id;

    return (
      <div
        className={`rounded-xl p-4 flex flex-col gap-2 relative ${
          isUserMatch
            ? 'bg-surface-container-high border-2 border-primary shadow-[0_0_30px_-5px_rgba(165,208,185,0.45)]'
            : 'bg-surface-container-high border border-white/10 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.4)]'
        } ${isFinalRound && isUserMatch ? 'border-tertiary/50' : ''}`}
        style={{ width: isFinalRound ? 300 : 248 }}
      >
        {isUserMatch && (
          <div
            className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full font-label-md text-[10px] uppercase tracking-widest font-bold z-20 whitespace-nowrap ${
              isChampion ? 'bg-tertiary text-on-tertiary shadow-[0_0_15px_rgba(233,195,73,0.5)]' : 'bg-primary text-on-primary'
            }`}
          >
            {isChampion ? 'CAMPEÓN' : 'Tu Partido'}
          </div>
        )}
        {renderTeamRow(match.homeTeam, isFinished ? match.homeScore : null, {
          isUser: match.homeTeam?.id === teamId,
          isWinner: homeWon,
          fallback: `Equipo ${slotIdx * 2 + 1}`,
        })}
        <div className="h-px bg-white/10 w-full"></div>
        {renderTeamRow(match.awayTeam, isFinished ? match.awayScore : null, {
          isUser: match.awayTeam?.id === teamId,
          isWinner: awayWon,
          fallback: `Equipo ${slotIdx * 2 + 2}`,
        })}

        {isUserMatch && !isFinished && (
          <button
            onClick={() => handleStartMatch(match)}
            disabled={isLoading || isAdvancing}
            className="mt-1 w-full bg-primary-container border border-primary text-primary hover:bg-primary hover:text-on-primary font-headline-sm text-xs uppercase py-2 rounded-lg transition-all shadow-lg disabled:opacity-50"
          >
            JUGAR PARTIDO
          </button>
        )}
        {isUserMatch && isFinished && isCurrentRound && !isChampion && (
          <button
            onClick={handleAdvance}
            disabled={isLoading || isAdvancing}
            className="mt-1 w-full bg-gradient-to-b from-primary to-primary-container text-on-primary font-headline-sm text-xs uppercase py-2 rounded-lg shadow-lg disabled:opacity-50 hover:brightness-110"
          >
            {isAdvancing ? 'AVANZANDO...' : 'CONTINUAR'}
          </button>
        )}
        {isUserMatch && isFinished && (!isCurrentRound || isChampion) && (
          <button
            onClick={() => setActiveMatch(match)}
            className="mt-1 w-full bg-surface-container border border-white/10 text-on-surface font-headline-sm text-xs uppercase py-2 rounded-lg shadow-lg hover:bg-surface-variant"
          >
            VER REPETICIÓN
          </button>
        )}
      </div>
    );
  };

  const renderConnectors = () => {
    const segments: React.ReactNode[] = [];
    for (let r = 0; r < 3; r++) {
      const boundaryX = (r + 1) / 4;
      const zoneStart = boundaryX - 0.02;
      const zoneEnd = boundaryX + 0.02;
      const n = ROUND_COLUMNS[r].count;
      for (let i = 0; i < n; i++) {
        const childY = ((i + 0.5) / n) * 100;
        const parentY = ((Math.floor(i / 2) + 0.5) / (n / 2)) * 100;
        const topY = Math.min(childY, parentY);
        const height = Math.abs(parentY - childY);
        segments.push(
          <div key={`conn-${r}-${i}`} className="pointer-events-none absolute inset-0">
            <div className="absolute bg-white/25" style={{ left: `${zoneStart * 100}%`, width: `${(boundaryX - zoneStart) * 100}%`, top: `${childY}%`, height: 2 }} />
            <div className="absolute bg-white/25" style={{ left: `${boundaryX * 100}%`, width: `${(zoneEnd - boundaryX) * 100}%`, top: `${parentY}%`, height: 2 }} />
            <div className="absolute bg-white/25" style={{ left: `calc(${boundaryX * 100}% - 1px)`, width: 2, top: `${topY}%`, height: `${height}%` }} />
          </div>,
        );
      }
    }
    return <>{segments}</>;
  };

  return (
    <div className="bg-surface text-on-surface h-screen w-screen flex flex-col antialiased relative pitch-bg overflow-hidden">
      {/* Header */}
      <header className="w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-lg shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-label-md text-label-md tracking-wider">VOLVER</span>
        </button>
        <div className="flex flex-col items-center leading-none">
          <div className="text-headline-md font-headline-md font-extrabold text-primary tracking-tighter uppercase">
            COPA ÉLITE
          </div>
          {tournament && (
            <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
              {ROUND_COLUMNS.find((c) => c.key === tournament.currentRound)?.label}
            </div>
          )}
        </div>
        <button onClick={handleReset} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <span className="font-label-md text-label-md tracking-wider uppercase">Nuevo Torneo</span>
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </header>

      {/* Main Bracket Canvas */}
      <div className="flex-1 overflow-auto relative p-xl pb-32">
        <div className="relative h-[1000px] min-w-[1320px]">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/60 backdrop-blur-sm rounded-xl">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
            </div>
          )}
          {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs max-w-xl text-center">
              {error}
            </div>
          )}
          {!tournament && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">emoji_events</span>
                <p className="font-body-md text-on-surface-variant mt-4">Preparando la Copa Élite...</p>
              </div>
            </div>
          )}

          {tournament && (
            <div className="relative w-full h-full">
              {/* Líneas conectoras (detrás de las tarjetas) */}
              <div className="absolute inset-0 z-0">{renderConnectors()}</div>

              {/* 4 Columnas: OCTAVOS → CUARTOS → SEMIS → FINAL */}
              <div className="absolute inset-0 z-10 grid grid-cols-4 pointer-events-none">
                {ROUND_COLUMNS.map((col) => (
                  <div key={col.key} className="relative pointer-events-none">
                    {/* Título de la columna */}
                    <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
                      <div
                        className={`font-headline-sm text-xs uppercase tracking-widest bg-surface/70 backdrop-blur px-3 py-1 rounded-full border border-white/10 ${
                          col.key === 'FINAL' ? 'text-tertiary' : 'text-primary'
                        }`}
                      >
                        {col.key === 'FINAL' && (
                          <span className="material-symbols-outlined text-[14px] align-middle mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                            trophy
                          </span>
                        )}
                        {col.label}
                      </div>
                    </div>

                    {Array.from({ length: col.count }).map((_, i) => {
                      const match = rounds[col.key]?.[i];
                      const top = ((i + 0.5) / col.count) * 100;
                      return (
                        <div
                          key={`${col.key}-${i}`}
                          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                          style={{ top: `${top}%` }}
                        >
                          {renderMatchCard(match, col.key, i)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay de Partido en Vivo */}
      {activeMatch && tournament && (
        <LiveMatchOverlay
          match={activeMatch}
          teamId={teamId || ''}
          isFinal={tournament.currentRound === 'FINAL'}
          onContinue={handleAdvance}
          onLose={handleLose}
          onClose={() => setActiveMatch(null)}
        />
      )}

      {/* Overlay de Fin de Torneo (derrota) */}
      {showDefeat && tournament && (
        <DefeatOverlay tournament={tournament} teamId={teamId || ''} onHome={handleGoHome} />
      )}
    </div>
  );
};
