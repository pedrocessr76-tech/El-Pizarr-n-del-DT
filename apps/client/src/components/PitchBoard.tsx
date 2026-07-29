import { useMemo } from 'react';
import { useDraftStore } from '../store/useDraftStore';

const FORMATION = [
  { pos: 'GK', row: 3, col: 2 },
  { pos: 'DEF', row: 2, col: 0 },
  { pos: 'DEF', row: 2, col: 1 },
  { pos: 'DEF', row: 2, col: 3 },
  { pos: 'DEF', row: 2, col: 4 },
  { pos: 'MID', row: 1, col: 0 },
  { pos: 'MID', row: 1, col: 2 },
  { pos: 'MID', row: 1, col: 4 },
  { pos: 'FWD', row: 0, col: 1 },
  { pos: 'FWD', row: 0, col: 2 },
  { pos: 'FWD', row: 0, col: 3 },
] as const;

function overallRating(stats: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }) {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function PitchBoard() {
  const team = useDraftStore((state) => state.team);

  const starters = useMemo(() => team.slice(0, 11), [team]);

  return (
    <section className="rounded-3xl border border-white/10 bg-stadium-panel/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-white">El Pizarrón</h2>
          <p className="text-sm text-slate-400">Formación 4-3-3 · Arrastra tu estrategia al campo</p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          4-3-3
        </span>
      </div>

      <div className="relative min-h-[480px] overflow-hidden rounded-3xl border-4 border-white/20 bg-pitch-gradient">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/15" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/15 bg-transparent" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/15" />

        <div className="relative grid h-full grid-cols-5 grid-rows-4 gap-3 p-6">
          {FORMATION.map((slot, index) => {
            const player = starters[index];
            return (
              <div
                key={`${slot.pos}-${index}`}
                style={{ gridRow: slot.row + 1, gridColumn: slot.col + 1 }}
                className="flex items-center justify-center"
              >
                <div
                  className={`flex w-full max-w-[120px] flex-col items-center rounded-2xl border px-2 py-3 text-center transition ${
                    player
                      ? 'border-cyan-400/40 bg-slate-950/90 shadow-lg shadow-cyan-500/10'
                      : 'border-white/20 border-dashed bg-slate-950/50'
                  }`}
                >
                  {player ? (
                    <>
                      <span className="font-display text-2xl text-amber-400">
                        {overallRating(player.stats)}
                      </span>
                      <p className="truncate text-xs font-semibold text-white">{player.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">{player.position}</p>
                    </>
                  ) : (
                    <p className="font-display text-lg text-white/40">{slot.pos}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {team.length > 11 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Suplentes</p>
          <div className="flex flex-wrap gap-2">
            {team.slice(11).map((player) => (
              <span
                key={player.id}
                className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300"
              >
                {player.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
