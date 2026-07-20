import type { Player } from '../../../../packages/shared/types/models';
import { ArrowUpRight, ShieldCheck, Zap, HeartPulse, Shield, Target } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
}

const statIcon = (stat: string) => {
  switch (stat) {
    case 'pace':
      return <Zap className="w-4 h-4" />;
    case 'shooting':
      return <ArrowUpRight className="w-4 h-4" />;
    case 'passing':
      return <Target className="w-4 h-4" />;
    case 'dribbling':
      return <HeartPulse className="w-4 h-4" />;
    case 'defending':
      return <Shield className="w-4 h-4" />;
    case 'physical':
      return <ShieldCheck className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

export function PlayerCard({ player, onSelect }: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="rounded-2xl border border-white/20 bg-slate-900/90 p-4 text-left shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-400"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{player.nationality}</p>
          <h3 className="text-lg font-semibold text-white">{player.name}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{player.position}</span>
      </div>

      <div className="grid gap-2 text-sm text-slate-200">
        {(Object.entries(player.stats) as [keyof typeof player.stats, number][]).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-lg bg-slate-950/80 px-3 py-2">
            <div className="flex items-center gap-2 text-slate-300">
              {statIcon(key)}
              <span>{key}</span>
            </div>
            <span className="font-semibold text-white">{value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
