import type { Player, PlayerStats } from '../../../../packages/shared/types/models';
import { ArrowUpRight, ShieldCheck, Zap, HeartPulse, Shield, Target } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
}

const statIcon = (stat: string) => {
  switch (stat) {
    case 'pace':
      return <Zap className="h-3.5 w-3.5" />;
    case 'shooting':
      return <ArrowUpRight className="h-3.5 w-3.5" />;
    case 'passing':
      return <Target className="h-3.5 w-3.5" />;
    case 'dribbling':
      return <HeartPulse className="h-3.5 w-3.5" />;
    case 'defending':
      return <Shield className="h-3.5 w-3.5" />;
    case 'physical':
      return <ShieldCheck className="h-3.5 w-3.5" />;
    default:
      return <Zap className="h-3.5 w-3.5" />;
  }
};

const statLabel: Record<string, string> = {
  pace: 'Ritmo',
  shooting: 'Tiro',
  passing: 'Pase',
  dribbling: 'Regate',
  defending: 'Defensa',
  physical: 'Físico',
};

function overallRating(stats: PlayerStats) {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function PlayerCard({ player, onSelect }: PlayerCardProps) {
  const rating = overallRating(player.stats);

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="group relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-slate-800/90 to-slate-950/95 p-4 text-left shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-cyan-500/10"
    >
      <div className="absolute -right-4 -top-4 font-display text-7xl text-white/[0.04]">{rating}</div>

      <div className="relative mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">{player.nationality}</p>
          <h3 className="font-display text-xl tracking-wide text-white">{player.name}</h3>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-display text-3xl leading-none text-amber-400">{rating}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/70">
            {player.position}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-1.5 text-xs">
        {(Object.entries(player.stats) as [keyof typeof player.stats, number][]).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-lg bg-slate-950/70 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              {statIcon(key)}
              <span>{statLabel[key] ?? key}</span>
            </div>
            <span
              className={`font-semibold ${
                value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-white' : 'text-slate-400'
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-cyan-400 opacity-0 transition group-hover:opacity-100">
        Seleccionar jugador
      </p>
    </button>
  );
}
