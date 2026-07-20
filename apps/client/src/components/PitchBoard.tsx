import { useMemo } from 'react';
import { useDraftStore } from '../store/useDraftStore';

export function PitchBoard() {
  const team = useDraftStore((state) => state.team);

  const positions = useMemo(
    () => [
      'GK',
      'DEF',
      'DEF',
      'DEF',
      'DEF',
      'MID',
      'MID',
      'MID',
      'FWD',
      'FWD',
      'FWD',
    ] as const,
    [],
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-emerald-900/80 p-6 shadow-2xl shadow-black/20">
      <h2 className="mb-4 text-2xl font-bold text-white">El Pizarrón</h2>
      <div className="min-h-[420px] rounded-3xl border-4 border-white/20 bg-green-700 p-4">
        <div className="grid h-full grid-cols-4 grid-rows-3 gap-4 p-4">
          {positions.map((pos, index) => {
            const player = team[index];
            return (
              <div
                key={`${pos}-${index}`}
                className="flex items-center justify-center rounded-3xl border border-white/20 bg-slate-950/80 p-3 text-center text-sm text-white"
              >
                {player ? (
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-slate-300">{player.position}</p>
                  </div>
                ) : (
                  <p className="text-slate-300">{pos}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
