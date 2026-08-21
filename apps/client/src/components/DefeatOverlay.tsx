import React, { useMemo } from 'react';
import type { Tournament } from '../../../../packages/shared/types/models';

interface DefeatOverlayProps {
  tournament: Tournament;
  teamId: string;
  onHome: () => void;
}

const ROUND_LABELS: Record<string, string> = {
  OCTAVOS: 'Octavos de Final',
  CUARTOS: 'Cuartos de Final',
  SEMIS: 'Semifinales',
  FINAL: 'Gran Final',
};

const Stat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="bg-surface-variant/50 rounded-lg p-3 text-center">
    <div className="font-stat-value text-stat-value text-primary">{value}</div>
    <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">{label}</div>
  </div>
);

export const DefeatOverlay: React.FC<DefeatOverlayProps> = ({ tournament, teamId, onHome }) => {
  const stats = useMemo(() => {
    const rounds = tournament.rounds || {};
    let played = 0;
    let wins = 0;
    let draws = 0;
    let gf = 0;
    let ga = 0;
    let lastRound = '';

    for (const roundKey of ['OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL']) {
      for (const m of (rounds as Record<string, any[]>)[roundKey] || []) {
        const isUserHome = m.homeTeam?.id === teamId;
        const isUserAway = m.awayTeam?.id === teamId;
        if (!isUserHome && !isUserAway) continue;
        lastRound = roundKey;
        if (m.status !== 'FINISHED') continue;
        played += 1;
        const myGoals = isUserHome ? m.homeScore : m.awayScore;
        const rivalGoals = isUserHome ? m.awayScore : m.homeScore;
        gf += myGoals;
        ga += rivalGoals;
        if (myGoals > rivalGoals) wins += 1;
        else if (myGoals === rivalGoals) draws += 1;
      }
    }

    return { played, wins, draws, gf, ga, lastRound };
  }, [tournament, teamId]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl"></div>
            <div className="relative w-full max-w-2xl md:max-w-3xl bg-surface-container rounded-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[calc(100vh-2rem)] overflow-x-hidden">
        <div className="p-8 md:p-10 flex flex-col items-center gap-6 text-center overflow-visible">
          <div className="w-20 h-20 rounded-full bg-error/15 border border-error/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
              flag
            </span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">Fin del Torneo</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              ¡Gran participación! Tu equipo llegó hasta{' '}
              <strong className="text-primary">{ROUND_LABELS[stats.lastRound] || 'la Copa Élite'}</strong>.
            </p>
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Partidos jugados" value={stats.played} />
            <Stat label="Victorias" value={stats.wins} />
            <Stat label="Empates" value={stats.draws} />
            <Stat label="Goles a favor" value={stats.gf} />
            <Stat label="Goles en contra" value={stats.ga} />
            <Stat label="Ronda alcanzada" value={ROUND_LABELS[stats.lastRound] || '-'} />
          </div>

          <div className="w-full border-t border-white/10 pt-6">
            <button
              onClick={onHome}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-lg bg-gradient-to-b from-primary to-primary-container text-on-primary font-headline-sm uppercase tracking-wider font-bold border border-primary-fixed shadow-[0_0_15px_rgba(165,208,185,0.3)] hover:shadow-[0_0_25px_rgba(165,208,185,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              Volver al Inicio
            </button>
            <p className="font-label-md text-label-md text-on-surface-variant mt-3">
              ¿Quieres intentarlo de nuevo? Arma un nuevo equipo y vuelve a jugar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
