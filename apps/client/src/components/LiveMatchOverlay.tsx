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
  playerName?: string;
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

// Pseudo-aleatorio determinista: mismas entradas -> mismo valor (0..1).
// Permite que las estadísticas evolucionen con el minuto de forma estable.
function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Elige un goleador con pesos realistas: delanteros 3, mediocampistas 2, defensores 1.
function pickScorer(players: Player[]): string {
  const pool: Player[] = [];
  players.forEach((p) => {
    const zone = (p.position?.[0] ?? 'M') as string;
    const weight = zone === 'F' ? 3 : zone === 'M' ? 2 : zone === 'D' ? 1 : 0;
    for (let i = 0; i < weight; i++) pool.push(p);
  });
  if (pool.length === 0) return players[0]?.name ?? '';
  return pick(pool).name;
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
// Cancha HORIZONTAL: x = avance a lo largo del campo (arco propio -> rival),
// y = distribución transversal. `defendsLeft`: el equipo defiende el arco izquierdo.
function teamBaseDots(players: Player[], defendsLeft: boolean): DotPos[] {
  const groups: Record<string, number[]> = { G: [], D: [], M: [], F: [] };
  const zoneFromGoal: Record<string, number> = { G: 9, D: 30, M: 50, F: 71 }; // avance desde el arco propio (%)
  players.forEach((p, i) => {
    const key = (p.position?.[0] ?? 'M') as string; // GK|DEF|MID|FWD -> G|D|M|F
    (groups[key] ?? groups.M).push(i);
  });
  const dots: DotPos[] = new Array(players.length);
  (Object.keys(zoneFromGoal) as string[]).forEach((key) => {
    const idxs = groups[key];
    if (!idxs?.length) return;
    const ys = spreadXs(idxs.length, 14, 86);
    const d = zoneFromGoal[key] / 100;
    idxs.forEach((playerIdx, j) => {
      // x es el avance desde el arco propio hacia el arco rival.
      const x = defendsLeft ? d * 100 : 100 - d * 100;
      // Deformación escalonada para que no queden todos en la misma línea.
      const stagger = ((playerIdx % 3) - 1) * 6;
      dots[playerIdx] = { x: x + (key === 'M' ? stagger * 0.6 : 0), y: ys[j] + stagger };
    });
  });
  return dots;
}

// Movimiento minuto a minuto (sincronizado con la velocidad del reloj).
// Pequeña oscilación orgánica individual de cada jugador.
function dotOffset(seed: number, minute: number): DotPos {
  const t = minute;
  return {
    x: Math.cos(t * 0.11 + seed * 2.3) * 1.2 + Math.sin(t * 0.05 + seed * 3.1) * 0.8,
    y: Math.sin(t * 0.14 + seed * 1.9) * 1.6,
  };
}

// Factor con el que cada zona sigue el desplazamiento del juego:
// los arqueros casi no se mueven del arco, la defensa acompaña poco,
// el mediocampo y el ataque se proyectan hacia donde está la pelota.
const ROLE_FOLLOW: Record<string, number> = { G: 0.06, D: 0.3, M: 0.5, F: 0.42 };

// Posición lógica de un jugador: mantiene su estructura base pero el bloque
// entero se desplaza hacia la zona donde está la pelota (eje largo del campo),
// y se estira levemente en el ancho según la altura del balón.
function playerPos(base: DotPos, role: string, ballX: number, ballY: number, seed: number, minute: number): DotPos {
  const follow = ROLE_FOLLOW[role] ?? 0.35;
  const off = dotOffset(seed, minute);
  const x = Math.min(96, Math.max(4, base.x + (ballX - 50) * follow + off.x));
  const y = Math.min(94, Math.max(6, base.y + (ballY - 50) * follow * 0.35 + off.y));
  return { x, y };
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
  const [goalBanner, setGoalBanner] = useState<{ playerName: string; teamName: string; minute: number; team: 'home' | 'away' } | null>(null);
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

  // Distribuir los goles del marcador final a lo largo de los 90 minutos,
  // asignando un goleador a cada gol (ponderado por posición).
  const { homeGoalMinutes, awayGoalMinutes, homeScorers, awayScorers } = useMemo(() => {
    const allMinutes = shuffleArray(Array.from({ length: 90 }, (_, i) => i + 1));
    const homeCount = Math.max(0, Math.min(90, match.homeScore || 0));
    const awayCount = Math.max(0, Math.min(90, match.awayScore || 0));
    const homeStarters = match.homeTeam?.starters || [];
    const awayStarters = match.awayTeam?.starters || [];
    const homeScorers: Record<number, string> = {};
    const awayScorers: Record<number, string> = {};
    allMinutes.slice(0, homeCount).forEach((m) => (homeScorers[m] = pickScorer(homeStarters)));
    allMinutes.slice(homeCount, homeCount + awayCount).forEach((m) => (awayScorers[m] = pickScorer(awayStarters)));
    return {
      homeGoalMinutes: allMinutes.slice(0, homeCount).sort((a, b) => a - b),
      awayGoalMinutes: allMinutes.slice(homeCount, homeCount + awayCount).sort((a, b) => a - b),
      homeScorers,
      awayScorers,
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
      const scorer = homeScorers[minute] || homeName;
      newEvents.push({ id: eventIdRef.current++, minute, text: `¡GOL DE ${homeName.toUpperCase()}! ${scorer} ${pick(GOAL_TEXTS)}`, team: 'home', isGoal: true, playerName: scorer });
      setHomeScore((s) => s + 1);
    }
    if (awayGoalMinutes.includes(minute)) {
      const scorer = awayScorers[minute] || awayName;
      newEvents.push({ id: eventIdRef.current++, minute, text: `¡GOL DE ${awayName.toUpperCase()}! ${scorer} ${pick(GOAL_TEXTS)}`, team: 'away', isGoal: true, playerName: scorer });
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
      const goal = newEvents.find((e) => e.isGoal);
      if (goal) {
        setGoalBanner({ playerName: goal.playerName || '', teamName: goal.team === 'home' ? homeName : awayName, minute, team: goal.team });
      }
    }
  }, [minute, homeGoalMinutes, awayGoalMinutes, homeScorers, awayScorers, homeName, awayName]);

  // Ocultar el cartel de gol unos segundos después de mostrarse.
  useEffect(() => {
    if (!goalBanner) return;
    const t = setTimeout(() => setGoalBanner(null), 4500);
    return () => clearTimeout(t);
  }, [goalBanner]);

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

  // --- Estadísticas en vivo: evolucionan minuto a minuto de forma realista ---
  // La posesión oscila alrededor de la tendencia (rating) con ruido por minuto;
  // tiros y tiros a puerta se acumulan con el transcurso del partido.
  const { homePossession, homeShots, awayShots, homeOnTarget, awayOnTarget } = useMemo(() => {
    const matchSeed = (match.id || 'm').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const f = minute / 90; // fracción del partido transcurrida
    // Deriva de la posesión: sin() + ruido determinista por minuto.
    const drift = Math.sin(minute * 0.35 + matchSeed) * 6 + (seededRand(matchSeed + minute) - 0.5) * 8;
    const possession = Math.min(68, Math.max(32, Math.round(50 + (homeRating - awayRating) * 1.2 + drift)));
    // Tiros acumulados: ~14 totales esperados, escalados por posesión y con ruido.
    const shotsExpected = 14 * f;
    const homeShots = minute === 0 ? 0 : Math.max(0, Math.round(shotsExpected * (possession / 50) * (0.7 + seededRand(matchSeed + 7) * 0.6)));
    const awayShots = minute === 0 ? 0 : Math.max(0, Math.round(shotsExpected * ((100 - possession) / 50) * (0.7 + seededRand(matchSeed + 13) * 0.6)));
    // A puerta: proporción de tiros + los goles reales convertidos.
    const homeOnTarget = Math.min(homeShots, Math.round(homeShots * 0.42) + homeScore);
    const awayOnTarget = Math.min(awayShots, Math.round(awayShots * 0.42) + awayScore);
    return { homePossession: possession, homeShots, awayShots, homeOnTarget, awayOnTarget };
  }, [minute, homeRating, awayRating, homeScore, awayScore, match.id]);

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
  const userDefendsLeft = !isHomeUser;
  const oppDefendsLeft = isHomeUser;
  const userDots = teamBaseDots(userStarters, userDefendsLeft);
  const oppDots = teamBaseDots(oppStarters, oppDefendsLeft);
  // --- Pelota en juego: recorre la cancha con lógica de posesión ---
  // La pelota se ubica en la zona donde domina el juego: deriva hacia el arco
  // del equipo con más posesión, con momentum ofensivo que va y viene.
  const matchSeed = (match.id || 'm').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const ballPos = useMemo(() => {
    // Momentum: la pelota viaja por carriles y cambia de sector con el tiempo.
    const swingX = Math.sin(minute * 0.45 + matchSeed * 0.7) * 20 + Math.sin(minute * 0.13 + matchSeed * 1.3) * 12;
    const possessionTilt = (homePossession - 50) * 0.9;
    const x = Math.min(92, Math.max(8, 50 + possessionTilt + swingX));
    // Carril transversal: la pelota cambia de banda y se centra cerca de las áreas.
    const nearArea = Math.abs(x - 50) > 28 ? 0.55 : 1; // más central cuando ataca un área
    const swingY = Math.sin(minute * 0.8 + matchSeed * 2.1) * 24 + (seededRand(matchSeed * 3 + minute) - 0.5) * 14;
    const y = Math.min(88, Math.max(12, 50 + swingY * nearArea));
    return { x, y };
  }, [minute, homePossession, matchSeed]);
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
                        <div className="flex-1 pitch-bg rounded-xl relative border border-white/20 shadow-2xl overflow-hidden min-h-[300px] transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 pitch-lines"></div>
              <div className="pitch-center-line"></div>
              <div className="pitch-center-circle"></div>
              <div className="penalty-box-left"></div>
              <div className="penalty-box-right"></div>

              {/* Pelota en juego: se mueve por la cancha según la posesión */}
              <span
                className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-700 ease-out"
                style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 20 }}
              >
                <span className="absolute inset-[3px] rounded-full border border-black/30" />
              </span>

              {/* Cartel de gol: jugador, equipo y minuto */}
              {goalBanner && (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                  style={{ animation: 'goal-banner-in 0.45s ease-out both' }}
                >
                  <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-tertiary-container via-tertiary to-tertiary-container border border-tertiary shadow-[0_0_35px_rgba(233,195,73,0.7)]">
                    <span className="material-symbols-outlined text-3xl text-on-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
                    <div className="text-center">
                      <div className="font-display-lg text-2xl font-extrabold text-on-tertiary tracking-widest leading-none">¡GOL!</div>
                      <div className="font-headline-sm text-sm font-bold text-on-tertiary mt-0.5 truncate max-w-[220px]">{goalBanner.playerName}</div>
                      <div className="font-label-md text-[10px] uppercase tracking-widest text-on-tertiary/80 mt-0.5">{goalBanner.teamName} · {goalBanner.minute}&apos;</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 22 jugadores en movimiento (11 por equipo) */}
              {userStarters.map((p, i) => {
                const base = userDots[i] || { x: 50, y: 50 };
                const pos = playerPos(base, (p.position?.[0] ?? 'M') as string, ballPos.x, ballPos.y, i, minute);
                return (
                  <PlayerDot
                    key={p.id}
                    player={p}
                    x={pos.x}
                    y={pos.y}
                    isUser
                    pulse={userScoredNow}
                  />
                );
              })}
              {oppStarters.map((p, i) => {
                const base = oppDots[i] || { x: 50, y: 50 };
                const pos = playerPos(base, (p.position?.[0] ?? 'M') as string, ballPos.x, ballPos.y, i + 11, minute);
                return (
                  <PlayerDot
                    key={p.id}
                    player={p}
                    x={pos.x}
                    y={pos.y}
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
