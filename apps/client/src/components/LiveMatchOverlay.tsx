import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Match, Player, Team } from '../../../../packages/shared/types/models';
import { PlayerMiniCard } from './PlayerCard';
const STADIUM_BG = '/images/stadium_bg.jpg';

interface MatchEvent {
  id: number;
  minute: number;
  text: string;
  team: 'home' | 'away';
  isGoal: boolean;
}

// Regla de producto: máximo de sustituciones por partido durante el en vivo.
const MAX_CHANGES = 5;

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

// --- Layout y movimiento de la cancha (22 puntos) ---

type DotPos = { x: number; y: number }; // posición en % sobre el campo

// Reparte N valores a lo largo de un rango horizontal (para las filas).
function spreadXs(count: number, min = 18, max = 82): number[] {
  if (count <= 1) return [(min + max) / 2];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

// Posición base (en %) de los 11 titulares según su zona FIFA.
// `defendsTop`: el equipo defiende el arco superior (ataca hacia abajo).
function teamBaseDots(players: Player[], defendsTop: boolean): DotPos[] {
  const groups: Record<string, number[]> = { G: [], D: [], M: [], F: [] };
  const zoneFromTop: Record<string, number> = { G: 9, D: 30, M: 50, F: 71 }; // avance desde el arco propio (%)
  players.forEach((p, i) => {
    const key = (p.position?.[0] ?? 'M') as string; // GK|DEF|MID|FWD -> G|D|M|F
    (groups[key] ?? groups.M).push(i);
  });
  const dots: DotPos[] = new Array(players.length);
  (Object.keys(zoneFromTop) as string[]).forEach((key) => {
    const idxs = groups[key];
    if (!idxs?.length) return;
    const xs = spreadXs(idxs.length);
    const d = zoneFromTop[key] / 100;
    idxs.forEach((playerIdx, j) => {
      // y es el avance desde el arco hacia el arco rival.
      const y = defendsTop ? d * 100 : 100 - d * 100;
      // Deformación escalonada para que no queden todos en la misma línea.
      const stagger = ((playerIdx % 3) - 1) * 7;
      dots[playerIdx] = { x: xs[j] + stagger, y: y + (key === 'M' ? stagger * 0.6 : 0) };
    });
  });
  return dots;
}

// Movimiento minuto a minuto (sincronizado con la velocidad del reloj).
// `fieldPushY` empuja el juego hacia el arco rival según la posesión.
function dotOffset(seed: number, minute: number, fieldPushY: number): DotPos {
  const t = minute;
  return {
    x: Math.sin(t * 0.14 + seed * 1.9) * 2,
    y: Math.cos(t * 0.11 + seed * 2.3) * 1.4 + fieldPushY + Math.sin(t * 0.05 + seed * 3.1) * 0.8,
  };
}

// Punto/jugador sobre la cancha.
const PlayerDot: React.FC<{ player: Player; x: number; y: number; isUser: boolean; pulse: boolean }> = ({
  player,
  x,
  y,
  isUser,
  pulse,
}) => (
  <div
    className="absolute pointer-events-none transition-all duration-700 ease-out"
    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
  >
        {pulse && (
      <span className="golden-ring"></span>
    )}
    <span
      className={[
        'relative flex items-center justify-center w-4 h-4 rounded-full border text-[7px] font-bold shadow-lg dot-user',
        isUser ? 'dot-user' : 'dot-opp',
      ].join(' ')}
      style={{ zIndex: 10 }}
    >
      {getInitials(player.name)}
    </span>
  </div>
);

const TeamScoreBadge: React.FC<{ name: string; score: number; isUser: boolean; minute: number; finished: boolean }> = ({ name, score, isUser, minute, finished }) => (
  <div className={`flex flex-col items-center gap-2 w-40 ${isUser ? 'scale-105' : 'opacity-80'}`}>
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold border-2 ${
        isUser
          ? 'bg-tertiary text-on-tertiary border-2 border-tertiary shadow-[0_0_15px_rgba(233,195,73,0.5)]'
          : 'bg-surface-variant text-on-surface border border-white/20'
      }`}
    >
      {isUser ? (
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
      ) : (
        <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
      )}
    </div>
    <div className={`font-headline-sm font-headline-sm text-sm text-center leading-tight ${isUser ? 'text-tertiary' : 'text-on-surface'}`}>{name}</div>
    <div className={`font-display-lg font-display-lg text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${isUser ? 'from-tertiary to-yellow-200' : 'from-on-surface to-on-surface-variant'} tabular-nums`}>{score}</div>
    {!finished && (
      <div className="font-label-md font-label-md text-[10px] text-on-surface-variant/60 uppercase tracking-widest">{minute}&apos;</div>
    )}
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

  // Alineación mutable del usuario: permite sustituciones que se reflejan
  // en el rating del equipo y, por tanto, en la simulación posterior.
  const [userStarters, setUserStarters] = useState<Player[]>(
    () => (match.homeTeam?.id === teamId ? match.homeTeam?.starters : match.awayTeam?.starters) || [],
  );
  const [userSubs, setUserSubs] = useState<Player[]>(
    () => (match.homeTeam?.id === teamId ? match.homeTeam?.substitutes : match.awayTeam?.substitutes) || [],
  );
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesUsed, setChangesUsed] = useState(0);
  const [selectedOut, setSelectedOut] = useState<Player | null>(null);
  const [selectedIn, setSelectedIn] = useState<Player | null>(null);

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

  const homeRating = avgRating({ starters: isHomeUser ? userStarters : match.homeTeam?.starters || [] } as Team);
  const awayRating = avgRating({ starters: isHomeUser ? match.awayTeam?.starters || [] : userStarters } as Team);
  const homePossession = Math.min(68, Math.max(32, Math.round(50 + (homeRating - awayRating) * 1.5)));
  const homeShots = Math.max(1, Math.round((match.homeScore || 0) * 2.5 + (homePossession - 50) / 20));
  const awayShots = Math.max(1, Math.round((match.awayScore || 0) * 2.5 + (50 - homePossession) / 20));
  const homeOnTarget = Math.max(0, Math.min(homeShots, Math.round((match.homeScore || 0) * 1.5 + homeShots / 3)));
  const awayOnTarget = Math.max(0, Math.min(awayShots, Math.round((match.awayScore || 0) * 1.5 + awayShots / 3)));

  const championLabel = isFinal && userWon ? '¡CAMPEÓN!' : '¡Victoria!';
  const winnerName = isHomeUser ? homeName : awayName;
  const loserName = isHomeUser ? awayName : homeName;

  // Aplica un cambio: el titular seleccionado sale, el suplente ingresa,
  // y se registra en el feed. El nuevo once modifica el rating del equipo.
  const canChange = !finished && changesUsed < MAX_CHANGES;
  const applySubstitution = () => {
    if (!selectedOut || !selectedIn || !canChange) return;
    setUserStarters((prev) => prev.map((p) => (p.id === selectedOut.id ? selectedIn : p)));
    setUserSubs((prev) => prev.map((p) => (p.id === selectedIn.id ? selectedOut : p)));
    setChangesUsed((c) => c + 1);
    const team: 'home' | 'away' = isHomeUser ? 'home' : 'away';
    const teamName = isHomeUser ? homeName : awayName;
    setEvents((prev) => [
      ...prev,
      {
        id: eventIdRef.current++,
        minute,
        text: `Cambio en ${teamName}: sale ${selectedOut.name}, entra ${selectedIn.name}.`,
        team,
        isGoal: false,
      },
    ]);
    setSelectedOut(null);
    setSelectedIn(null);
    setChangesOpen(false);
  };

  // --- Cancha: 22 puntos (11 por equipo) con movimiento minuto a minuto ---
  const oppStarters = isHomeUser ? match.awayTeam?.starters || [] : match.homeTeam?.starters || [];
  const userDefendsTop = !isHomeUser;
  const oppDefendsTop = isHomeUser;
  const userDots = teamBaseDots(userStarters, userDefendsTop);
  const oppDots = teamBaseDots(oppStarters, oppDefendsTop);
  // El equipo con más posesión ataca: mueve todo el juego hacia su arco rival.
  const fieldPushY = (homePossession - 50) * 0.12;
  const userScoredNow = (isHomeUser ? homeGoalMinutes.includes(minute) : awayGoalMinutes.includes(minute)) && minute > 0;
  const oppScoredNow = (isHomeUser ? awayGoalMinutes.includes(minute) : homeGoalMinutes.includes(minute)) && minute > 0;

    return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-lg">
            {/* Fondo de estadio difuminado */}
      <div
        className="absolute inset-0 opacity-30 z-0"
        style={{
          backgroundImage: `url(${STADIUM_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)',
        }}
        data-alt="Fondo difuminado de un estadio moderno bajo focos nocturnos"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-0"></div>

      {/* Modal de cristal (glass-panel) */}
      <div className="glass-panel relative w-full max-w-[1400px] h-[800px] rounded-[24px] flex flex-col overflow-hidden">
        {/* Header Section */}
        <header className="flex flex-col gap-md p-lg border-b border-white/10">
          <div className="flex justify-between items-center w-full">
            {/* Live Indicator con live-dot */}
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
              <span className="live-dot"></span>
              <span className="font-label-md font-label-md text-white font-bold tracking-widest">EN VIVO</span>
            </div>

            {/* Match Progress Bar (90 minutos) */}
            <div className="flex-grow max-w-3xl mx-xl flex flex-col gap-2">
              <div className="flex justify-between font-label-md font-label-md text-on-surface-variant">
                <span>0&apos;</span>
                <span>45&apos;</span>
                <span>90&apos;</span>
              </div>
              <div className="h-[6px] bg-white/15 rounded-full w-full relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-tertiary rounded-full shadow-[0_0_10px_rgba(233,195,73,0.8)]"
                  style={{ width: `${Math.min(100, (minute / 90) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Speed Controls */}
            <div className="flex bg-surface-container rounded-full p-1 border border-white/10">
              {([30, 60, 90] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  disabled={finished}
                  className={`px-4 py-1 font-label-md font-label-md text-sm transition-colors ${
                    speed === s
                      ? 'bg-tertiary text-on-tertiary rounded-full font-bold shadow-md'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  x{s}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setChangesOpen((o) => !o)}
              disabled={!canChange}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-xs uppercase border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                changesOpen ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant hover:text-on-surface border-outline/40'
              }`}
              title="Cambios disponibles durante el partido"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              Cambios
              <span className="font-stat-value opacity-80">{MAX_CHANGES - changesUsed}</span>
            </button>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>
        </header>

        {/* Panel de cambios (sustituciones en tiempo real) */}
        {changesOpen && !finished && (
          <div className="absolute inset-x-4 top-20 bottom-4 z-20 bg-surface-container-high/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>swap_horiz</span>
                <span className="font-headline-sm text-on-surface">Cambios</span>
                <span className="font-label-md text-xs text-on-surface-variant">({MAX_CHANGES - changesUsed} disponibles)</span>
              </div>
              <button
                onClick={() => setChangesOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-8 min-h-0">
              <div>
                <div className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                  En cancha · toca un titular para sacarlo
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {userStarters.map((p) => (
                    <PlayerMiniCard
                      key={p.id}
                      player={p}
                      rating={p.rating ?? 50}
                      onClick={() => setSelectedOut(selectedOut?.id === p.id ? null : p)}
                      isRelocating={selectedOut?.id === p.id}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                  Banca · toca un suplente para ingresarlo
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {userSubs.map((p) => (
                    <PlayerMiniCard
                      key={p.id}
                      player={p}
                      rating={p.rating ?? 50}
                      onClick={() => setSelectedIn(selectedIn?.id === p.id ? null : p)}
                      isRelocating={selectedIn?.id === p.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-on-surface-variant min-w-0 truncate">
                {selectedOut && selectedIn
                  ? `Sale ${selectedOut.name} · entra ${selectedIn.name}`
                  : 'Selecciona un titular y un suplente para realizar el cambio.'}
              </div>
              <button
                onClick={applySubstitution}
                disabled={!selectedOut || !selectedIn || !canChange}
                className="px-6 py-2 rounded-lg font-label-md uppercase font-bold bg-gradient-to-b from-primary to-primary-container text-on-primary border border-primary-fixed disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shrink-0"
              >
                Realizar cambio
              </button>
            </div>
          </div>
        )}

        {/* Marcador */}
        <div className="px-6 pt-4 flex items-center justify-center gap-6 shrink-0">
                  <TeamScoreBadge name={homeName} score={homeScore} isUser={isHomeUser} minute={minute} finished={finished} />
          <div className="text-center">
            <div className="font-display-lg text-5xl font-extrabold text-on-surface tabular-nums">
              {homeScore} - {awayScore}
            </div>
            {finished && match.homeScore === match.awayScore && (
              <div className="font-label-md text-[10px] text-tertiary uppercase tracking-widest mt-1">Definido por penales</div>
            )}
          </div>
          <TeamScoreBadge name={awayName} score={awayScore} isUser={!isHomeUser} minute={minute} finished={finished} />
        </div>

        {/* Cuerpo */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 p-6 flex flex-col gap-4 border-r border-white/10 min-w-0">
                        <div className="flex-1 pitch-bg rounded-xl relative border border-white/20 shadow-2xl overflow-hidden min-h-[220px] transform-gpu hover:scale-[1.01]" style={{ transformStyle: 'preserve-3d' }}>
                            <div className="absolute inset-0 pitch-lines"></div>
              <div className="pitch-center-line"></div>
              <div className="pitch-center-circle"></div>
              <div className="pitch-penalty-area-top"></div>
              <div className="pitch-penalty-area-bottom"></div>

              {/* Balón de fútbol blanco */}
              <span
                className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{ left: '50%', top: '48%', transform: 'translate(-50%, -50%)', zIndex: 5 }}
              />

              {/* 22 jugadores en movimiento (11 por equipo) */}
              {userStarters.map((p, i) => {
                const base = userDots[i] || { x: 50, y: 50 };
                const off = dotOffset(i, minute, fieldPushY);
                return (
                  <PlayerDot
                    key={p.id}
                    player={p}
                    x={base.x + off.x}
                    y={base.y + off.y}
                    isUser
                    pulse={userScoredNow}
                  />
                );
              })}
              {oppStarters.map((p, i) => {
                const base = oppDots[i] || { x: 50, y: 50 };
                const off = dotOffset(i, minute, fieldPushY);
                return (
                  <PlayerDot
                    key={p.id}
                    player={p}
                    x={base.x + off.x}
                    y={base.y + off.y}
                    isUser={false}
                    pulse={oppScoredNow}
                  />
                );
              })}
            </div>

                        {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-surface-container/50 backdrop-blur rounded-xl p-4 border border-white/5">
              <div className="bg-surface-container-high/40 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between font-label-md text-xs text-on-surface-variant mb-1">
                  <span className="truncate pr-2">{homeName}</span>
                  <span>{homePossession}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-variant flex overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-tertiary transition-all shadow-[0_0_8px_rgba(165,208,185,0.5)]" style={{ width: `${homePossession}%` }}></div>
                </div>
                <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Posesión</div>
              </div>
              <div className="bg-surface-container-high/40 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between font-label-md text-xs text-on-surface-variant mb-1">
                  <span className="truncate pr-2">{awayName}</span>
                  <span>{100 - homePossession}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-variant flex overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-tertiary to-primary transition-all shadow-[0_0_8px_rgba(233,195,73,0.5)]" style={{ width: `${100 - homePossession}%` }}></div>
                </div>
                <div className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Posesión</div>
              </div>
                            <div className="bg-surface-container-high/40 rounded-lg p-3 border border-white/5 flex justify-between items-center">
                <span className="font-stat-value text-xl text-primary">{homeShots}</span>
                <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest">Tiros</span>
                <span className="font-stat-value text-xl text-on-surface-variant">{awayShots}</span>
              </div>
              <div className="bg-surface-container-high/40 rounded-lg p-3 border border-white/5 flex justify-between items-center">
                <span className="font-stat-value text-xl text-primary">{homeOnTarget}</span>
                <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest">A puerta</span>
                <span className="font-stat-value text-xl text-on-surface-variant">{awayOnTarget}</span>
              </div>
            </div>
          </div>

                    {/* Comentarios en vivo */}
          <div className="w-96 flex flex-col bg-surface-container/50 backdrop-blur shrink-0 border-l border-white/5">
            <h4 className="font-headline-sm text-on-surface px-4 py-3 border-b border-white/10">Comentarios en vivo</h4>
            <div ref={commentsRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
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
          <div className="bg-surface-container-high/50 backdrop-blur border-t border-white/5 p-6 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <span className={`material-symbols-outlined text-4xl ${userWon ? 'text-tertiary drop-shadow-[0_0_10px_rgba(233,195,73,0.5)]' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {userWon ? 'emoji_events' : 'flag'}
              </span>
              <div className="min-w-0">
                <div className={`font-display-lg font-display-lg text-3xl font-extrabold ${
                  userWon
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-tertiary to-yellow-200'
                    : 'text-error'
                }`}>
                  {userWon ? championLabel : 'Derrota'}
                </div>
                <div className="font-body-md font-body-md text-sm text-on-surface-variant truncate">
                  {userWon
                    ? `${winnerName} avanza${isFinal ? ' y levanta la Copa Élite' : ' en la llave'}.`
                    : `${loserName} continúa en el torneo.`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-label-md font-label-md text-xs uppercase border border-white/20 text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
              >
                CERRAR
              </button>
              <button
                onClick={userWon ? onContinue : onLose}
                className={`px-6 py-2 rounded-lg font-label-md font-label-md text-xs uppercase font-bold transition-all transform hover:scale-[1.02] ${
                  userWon
                    ? 'bg-gradient-to-r from-tertiary to-amber-500 text-on-tertiary shadow-[0_0_15px_rgba(233,195,73,0.5)] hover:shadow-[0_0_25px_rgba(233,195,73,0.8)]'
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
