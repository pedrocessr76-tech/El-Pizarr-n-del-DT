import { useState } from 'react';
import axios from 'axios';
import type { Match, Tournament, Team } from '../../../../packages/shared/types/models';
import { useDraftStore } from '../store/useDraftStore';

export function MatchSimulator() {
  const team = useDraftStore((state) => state.team);
  const tournament = useDraftStore((state) => state.tournament);
  const setTournament = useDraftStore((state) => state.setTournament);
  
  const [matchResult, setMatchResult] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateTournament = async () => {
    setLoading(true);
    setMessage('Generando torneo de Octavos de Final...');

    // Asumimos que los primeros 11 son titulares y el resto suplentes
    const userTeam: Team = {
      id: 'user-team',
      name: 'Tu Equipo',
      starters: team.slice(0, 11),
      substitutes: team.slice(11),
    };

    try {
      const response = await axios.post<Tournament>('/match/tournament/create', {
        userTeam,
      });
      setTournament(response.data);
      setMatchResult(null);
      setMessage('¡Torneo iniciado! Estás en Octavos de Final.');
    } catch (error) {
      setMessage('Error al crear el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMatch = async () => {
    if (!tournament) return;

    const currentRoundMatches = tournament.rounds[tournament.currentRound];
    const userMatch = currentRoundMatches.find(
      (m) => m.homeTeam.id === 'user-team' || m.awayTeam.id === 'user-team'
    );

    if (!userMatch) return;

    setLoading(true);
    setMessage(`Simulando partido contra ${userMatch.homeTeam.id === 'user-team' ? userMatch.awayTeam.name : userMatch.homeTeam.name}...`);

    try {
      // 1. Simular el partido del usuario
      const response = await axios.post<Match>('/match/tournament/simulate-match', {
        homeTeam: userMatch.homeTeam,
        awayTeam: userMatch.awayTeam,
      });
      
      const result = response.data;
      setMatchResult(result);

      if (result.winnerId === 'user-team') {
        setMessage('¡Ganaste! Avanzas a la siguiente ronda.');
        // Aquí se podría implementar la lógica para avanzar el torneo completo
        // Por brevedad, solo actualizamos el mensaje.
      } else {
        setMessage('Has sido eliminado del torneo.');
      }
    } catch (error) {
      setMessage('Error al simular el partido');
    } finally {
      setLoading(false);
    }
  };

  if (team.length < 11 || team.length > 18) {
    return (
      <section className="rounded-3xl border border-white/10 bg-stadium-panel/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <h2 className="font-display text-3xl tracking-wide text-white">Copa de Campeones</h2>
        <p className="mt-2 text-sm text-slate-400">
          Necesitas entre 11 y 18 jugadores en tu plantilla ({team.length}/18).
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{ width: `${Math.min((team.length / 11) * 100, 100)}%` }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-stadium-panel/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-white">Copa de Campeones</h2>
          <p className="text-sm text-slate-400">
            {tournament
              ? `Compitiendo en ${tournament.currentRound}`
              : 'Torneo de eliminación directa contra los mejores equipos.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!tournament ? (
            <button
              type="button"
              onClick={handleCreateTournament}
              disabled={loading}
              className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Preparando...' : 'Iniciar Torneo'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSimulateMatch}
              disabled={loading || Boolean(matchResult && matchResult.winnerId !== 'user-team')}
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Jugando...' : 'Jugar partido'}
            </button>
          )}
          {tournament && (
            <button
              type="button"
              onClick={() => setTournament(null)}
              className="rounded-full border border-red-500/50 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              Abandonar
            </button>
          )}
        </div>
      </div>

      {message && <p className="text-sm font-medium text-cyan-400">{message}</p>}

      {tournament && !matchResult && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">Próximo rival</p>
          {(() => {
            const m = tournament.rounds[tournament.currentRound].find(
              (m) => m.homeTeam.id === 'user-team' || m.awayTeam.id === 'user-team',
            );
            const rival = m?.homeTeam.id === 'user-team' ? m.awayTeam : m?.homeTeam;
            return rival ? (
              <p className="mt-2 font-display text-4xl tracking-wide text-white">{rival.name}</p>
            ) : null;
          })()}
        </div>
      )}

      {matchResult && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6">
          <div className="mb-4 flex items-center justify-between gap-4 text-white">
            <div className="flex-1 text-right">
              <p className="text-xs uppercase tracking-wider text-slate-500">Local</p>
              <p className="truncate font-display text-2xl">{matchResult.homeTeam.name}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-3">
              <p className="font-display text-5xl text-cyan-400">{matchResult.homeScore}</p>
              <p className="text-slate-600">:</p>
              <p className="font-display text-5xl text-cyan-400">{matchResult.awayScore}</p>
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs uppercase tracking-wider text-slate-500">Visitante</p>
              <p className="truncate font-display text-2xl">{matchResult.awayTeam.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div
              className={`rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest ${
                matchResult.winnerId === 'user-team'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {matchResult.winnerId === 'user-team' ? 'Victoria' : 'Derrota'}
            </div>
            {matchResult.homeScore === matchResult.awayScore && (
              <p className="text-[10px] font-bold uppercase text-slate-500">Ganado por penales</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
