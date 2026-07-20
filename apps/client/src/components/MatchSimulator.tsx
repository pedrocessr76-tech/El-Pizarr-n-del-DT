import { useState } from 'react';
import axios from 'axios';
import type { Match, Team } from '../../../../packages/shared/types/models';
import { useDraftStore } from '../store/useDraftStore';

const difficulties = ['EASY', 'MEDIUM', 'HARD', 'LEGENDARY'] as const;

type Difficulty = (typeof difficulties)[number];

export function MatchSimulator() {
  const team = useDraftStore((state) => state.team);
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [matchResult, setMatchResult] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSimulate = async () => {
    setLoading(true);
    setMessage('Simulando partido...');

    const userTeam: Team = {
      id: 'user-team',
      name: 'Equipo del usuario',
      startingEleven: team,
    };

    try {
      const response = await axios.post<Match>('/match/simulate', {
        userTeam,
        difficulty,
      });
      setMatchResult(response.data);
      setMessage('Partido simulado correctamente');
    } catch (error) {
      setMessage('Error al simular el partido');
      setMatchResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (team.length !== 11) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Simulador de partido</h2>
          <p className="text-sm text-slate-400">Elige la dificultad y enfrenta a un equipo rival generado por la IA.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            className="rounded-full border border-white/20 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          >
            {difficulties.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSimulate}
            disabled={loading}
            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Simulando...' : 'Simular partido'}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300">{message}</p>

      {matchResult && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-4 text-white">
            <div>
              <p className="text-sm text-slate-400">Local</p>
              <p className="text-2xl font-bold">{matchResult.homeTeam.name}</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{matchResult.homeScore}</p>
              <p className="text-slate-400">VS</p>
              <p className="text-5xl font-bold">{matchResult.awayScore}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Visitante</p>
              <p className="text-2xl font-bold">{matchResult.awayTeam.name}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-green-700/20 p-4">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Estado</p>
              <p className="mt-2 text-xl font-semibold text-white">{matchResult.status}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Dificultad</p>
              <p className="mt-2 text-xl font-semibold text-white">{difficulty}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
