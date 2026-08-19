import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Match, Team } from '../../../../packages/shared/types/models';

interface MatchEvent {
  id: number;
  minute: number;
  text: string;
  team: 'home' | 'away';
  isGoal: boolean;
}

interface LiveMatchOverlayProps {
  match: Match;
  teamId: string;
  isFinal: boolean;
  onContinue: () => void;
  onLose: () => void;
  onClose: () => void;
}

const GOAL_TEXTS = [
  'Remate implacable cruzado al segundo palo.',
  'Cabezazo fulminante tras un centro perfecto.',
  'Jugada colectiva de manual que termina en gol.',
  'Contraataque letal definido con sangre fría.',
  'Tiro libre magistral que se cuela en la escuadra.',
];

const COMMENT_TEXTS = [
  '¡Gran jugada! Filtra un pase peligroso, pero la defensa despeja.',
  'Disparo lejano que se va apenas desviado.',
  'Córner a favor, la zaga rechaza con peligro.',
  'Amarilla por una entrada dura en el medio campo.',
  'Tiro libre peligroso que pasa rozando el travesaño.',
  'El portero se luce con una gran estirada.',
  'Centro al área que nadie consigue rematar.',
  'Presión alta que ahoga la salida rival.',
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function avgRating(team?: Team): number {
  if (!team || !team.starters || team.starters.length === 0) return 50;
  const ratings = team.starters.filter((p) => typeof p.rating === 'number').map((p) => p.rating as number);
  if (ratings.length === 0) return 50;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const TeamScoreBadge: React.FC<{ name: string; score: number; isUser: boolean }> = ({ name, score, isUser }) => (
  <div className={`flex flex-col items-center gap-2 w-40 ${isUser ? 'scale-105' : 'opacity-80'}`}>
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-extrabold border-2 ${
        isUser ? 'bg-tertiary text-on-tertiary border-tertiary' : 'bg-surface-variant text-on-surface border-white/20'
      }`}
    >
      {getInitials(name)}
    </div>
    <div className={`font-headline-sm text-sm text-center leading-tight ${isUser ? 'text-tertiary' : 'text-on-surface'}`}>{name}</div>
    <div className="font-display-lg text-3xl font-extrabold text-on-surface tabular-nums">{score}</div>
  </div>
);

export const LiveMatchOverlay: React.FC<LiveMatchOverlayProps> = ({ match, teamId, isFinal, onContinue, onLose, onClose }) => {
  const [minute, setMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [speed, setSpeed] = useState<30 | 60 | 90>(30);
  const [finished, setFinished] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const eventIdRef = useRef(0);

  const homeName = match.homeTeam?.name || 'Local';
  const awayName = match.awayTeam?.name || 'Visitante';
  const isHomeUser = match.homeTeam?.id === teamId;
  const userWon = match.winnerId === teamId;

  // Distribuir los goles del marcador final a lo largo de los 90 minutos.
  const { homeGoalMinutes, awayGoalMinutes } = useMemo(() => {
    const allMinutes = shuffleArray(Array.from({ length: 90 }, (_, i) => i + 1));
    const homeCount = Math.max(0, Math.min(90, match.homeScore || 0));
    const awayCount = Math.max(0, Math.min(90, match.awayScore || 0));
    return {
      homeGoalMinutes: allMinutes.slice(0, homeCount).sort((a, b) => a - b),
      awayGoalMinutes: allMinutes.slice(homeCount, homeCount + awayCount).sort((a, b) => a - b),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  // Avance del reloj según la velocidad (x30 → 1 minuto de juego por segundo real).
  useEffect(() => {
    if (finished || minute >= 90) return;
    const intervalMs = Math.max(200, Math.round(30000 / speed));
    const timer = setInterval(() => {
      setMinute((m) => (m >= 90 ? m : m + 1));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [finished, minute >= 90, speed]);

  // Procesar goles y comentarios al llegar a cada minuto.
  useEffect(() => {
    if (minute === 0) return;
    const newEvents: MatchEvent[] = [];
    if (homeGoalMinutes.includes(minute)) {
      newEvents.push({ id: eventIdRef.current++, minute, text: `¡GOL DE ${homeName.toUpperCase()}! ${pick(GOAL_TEXTS)}`, team: 'home', isGoal: true });
      setHomeScore((s) => s + 1);
    }
    if (awayGoalMinutes.includes(minute)) {
      newEvents.push({ id: eventIdRef.current++, minute, text: `¡GOL DE ${awayName.toUpperCase()}! ${pick(GOAL_TEXTS)}`, team: 'away', isGoal: true });
      setAwayScore((s) => s + 1);
    }
    if (newEvents.length === 0 && Math.random() < 0.18) {
      newEvents.push({
        id: eventIdRef.current++,
        minute,
        text: pick(COMMENT_TEXTS),
        team: Math.random() < 0.5 ? 'home' : 'away',
        isGoal: false,
      });
    }
    if (newEvents.length > 0) {
      setEvents((prev) => [...prev, ...newEvents]);
    }
  }, [minute, homeGoalMinutes, awayGoalMinutes, homeName, awayName]);

  // Marcar el partido como finalizado al llegar al minuto 90.
  useEffect(() => {
    if (minute >= 90) {
      const t = setTimeout(() => setFinished(true), 700);
      return () => clearTimeout(t);
    }
  }, [minute]);

  // Auto-scroll de comentarios.
  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [events]);

  const homeRating = avgRating(match.homeTeam);
  const awayRating = avgRating(match.awayTeam);
  const homePossession = Math.min(68, Math.max(32, Math.round(50 + (homeRating - awayRating) * 1.5)));
  const homeShots = Math.max(1, Math.round((match.homeScore || 0) * 2.5 + (homePossession - 50) / 20));
  const awayShots = Math.max(1, Math.round((match.awayScore || 0) * 2.5 + (50 - homePossession) / 20));
  const homeOnTarget = Math.max(0, Math.min(homeShots, Math.round((match.homeScore || 0) * 1.5 + homeShots / 3)));
  const awayOnTarget = Math.max(0, Math.min(awayShots, Math.round((match.awayScore || 0) * 1.5 + awayShots / 3)));

  const championLabel = isFinal && userWon ? '¡CAMPEÓN!' : '¡Victoria!';
  const winnerName = isHomeUser ? homeName : awayName;
  const loserName = isHomeUser ? awayName : homeName;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl"></div>
      <div className="relative w-full max-w-6xl h-[90vh] bg-surface-container rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-surface-container-high border-b border-white/10 p-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary animate-pulse">sensors</span>
            <span className="font-label-md text-primary tracking-widest uppercase">En Vivo</span>
            <span className="font-display-lg text-3xl font-extrabold text-on-surface tabular-nums w-20">{minute}&apos;</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-variant rounded-lg p-1">
            {([30, 60, 90] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                disabled={finished}
                className={`px-3 py-1 rounded-md font-label-md text-xs transition-colors ${
                  speed === s ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                x{s}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Marcador */}
        <div className="px-6 pt-4 flex items-center justify-center gap-6 shrink-0">
          <TeamScoreBadge name={homeName} score={homeScore} isUser={isHomeUser} />
          <div className="text-center">
            <div className="font-display-lg text-5xl font-extrabold text-on-surface tabular-nums">
              {homeScore} - {awayScore}
            </div>
            {finished && match.homeScore === match.awayScore && (
              <div className="font-label-md text-[10px] text-tertiary uppercase tracking-widest mt-1">Definido por penales</div>
            )}
          </div>
          <TeamScoreBadge name={awayName} score={awayScore} isUser={!isHomeUser} />
        </div>

        {/* Cuerpo */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 p-6 flex flex-col gap-4 border-r border-white/10 min-w-0">
            <div className="flex-1 pitch-bg rounded-xl relative border border-white/20 shadow-2xl overflow-hidden min-h-[220px]">
              <div className="absolute inset-0 pitch-lines"></div>
              <div className="pitch-center-line"></div>
              <div className="pitch-center-circle"></div>
              <div className="pitch-penalty-area-top"></div>
              <div className="pitch-penalty-area-bottom"></div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <div className="flex justify-between font-label-md text-xs text-on-surface-variant mb-1">
                  <span className="truncate pr-2">{homeName}</span>
                  <span>{homePossession}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-variant flex overflow-hidden">
                  <div className="h-full bg-tertiary transition-all" style={{ width: `${homePossession}%` }}></div>
                </div>
                <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Posesión</div>
              </div>
              <div>
                <div className="flex justify-between font-label-md text-xs text-on-surface-variant mb-1">
                  <span className="truncate pr-2">{awayName}</span>
                  <span>{100 - homePossession}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-variant flex overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${100 - homePossession}%` }}></div>
                </div>
                <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Posesión</div>
              </div>
              <div className="flex justify-between items-center font-label-md text-xs text-on-surface-variant">
                <span>{homeShots}</span>
                <span className="uppercase tracking-widest">Tiros</span>
                <span>{awayShots}</span>
              </div>
              <div className="flex justify-between items-center font-label-md text-xs text-on-surface-variant">
                <span>{homeOnTarget}</span>
                <span className="uppercase tracking-widest">A puerta</span>
                <span>{awayOnTarget}</span>
              </div>
            </div>
          </div>

          {/* Comentarios en vivo */}
          <div className="w-96 flex flex-col bg-surface-container shrink-0">
            <h4 className="font-headline-sm text-on-surface px-4 py-3 border-b border-white/10">Comentarios en vivo</h4>
            <div ref={commentsRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {events.length === 0 && <p className="text-on-surface-variant text-sm italic">El árbitro da el silbatazo inicial...</p>}
              {events.map((e) => (
                <div key={e.id} className={`flex gap-3 ${e.isGoal ? '' : 'opacity-70'}`}>
                  <span className={`font-stat-value w-9 shrink-0 ${e.isGoal ? 'text-tertiary' : 'text-primary'}`}>{e.minute}&apos;</span>
                  <p className="font-body-md text-sm text-on-surface-variant">
                    {e.isGoal && (
                      <span className="material-symbols-outlined text-[14px] text-tertiary align-middle mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
                    )}
                    <strong className={e.isGoal ? 'text-tertiary' : 'text-on-surface'}>
                      {e.team === 'home' ? homeName : awayName}:{' '}
                    </strong>
                    {e.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resultado final + acciones */}
        {finished && (
          <div className="bg-surface-container-high border-t border-white/10 p-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`material-symbols-outlined text-3xl ${userWon ? 'text-tertiary' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {userWon ? 'emoji_events' : 'flag'}
              </span>
              <div className="min-w-0">
                <div className={`font-headline-sm ${userWon ? 'text-tertiary' : 'text-error'}`}>
                  {userWon ? championLabel : 'Derrota'}
                </div>
                <div className="font-body-md text-sm text-on-surface-variant truncate">
                  {userWon
                    ? `${winnerName} avanza${isFinal ? ' y levanta la Copa Élite' : ' en la llave'}.`
                    : `${loserName} continúa en el torneo.`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md uppercase"
              >
                CERRAR
              </button>
              <button
                onClick={userWon ? onContinue : onLose}
                className={`px-6 py-2 rounded-lg font-label-md uppercase font-bold transition-all transform hover:scale-[1.02] ${
                  userWon
                    ? 'bg-gradient-to-b from-primary to-primary-container text-on-primary border border-primary-fixed shadow-[0_0_15px_rgba(165,208,185,0.3)]'
                    : 'bg-error text-on-error border border-error'
                }`}
              >
                {userWon ? (isFinal ? 'RECIBIR TROFEO' : 'CONTINUAR') : 'VER RESULTADO'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
