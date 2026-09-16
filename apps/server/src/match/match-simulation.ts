import type { Player, Team, PlayerMatchStats, MatchSummary } from '../../../../packages/shared/types/models';

export type MatchSimulationResult = {
  homeScore: number;
  awayScore: number;
  winnerId: string;
  summary: MatchSummary;
};

/**
 * Lógica de simulación de partidos extraída como módulo puro para testabilidad.
 *
 * - Goles distribuidos vía Poisson (±12 puntos de rating ≈ ±1 gol esperado).
 * - Penales ponderados para desempatar (probabilidad 0.5 ± diff/40, acotada [0.15, 0.85]).
 * - Calificaciones por jugador (matchRating 1–10), goles y asistencias.
 */
export class MatchSimulation {
  /** Media de rating de los 11 titulares (fallback 50 si no hay starters). */
  averageTeamRating(team: Team): number {
    const ratings = team.starters
      .filter((player) => typeof player.rating === 'number')
      .map((player) => player.rating as number);
    if (ratings.length === 0) return 50;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }

  /** Distribución de Poisson (Knuth): nº de goles para un lambda dado. */
  poissonRandom(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= Math.random();
    } while (p > L);
    return Math.max(0, k - 1);
  }

  /** Goles esperados: ±12 puntos de rating ≈ ±1 gol esperado. */
  expectedGoals(teamRating: number, opponentRating: number): number {
    const ratingDiff = teamRating - opponentRating;
    return Math.max(0.25, 1.5 + ratingDiff / 12);
  }

  /** Probabilidad de ganar penales para el local (0.5 ± diff/40, acotada [0.15, 0.85]). */
  penaltyWinProbability(ratingDiff: number): number {
    return Math.min(0.85, Math.max(0.15, 0.5 + ratingDiff / 40));
  }

  /** Distribuye goles ponderados por shooting (con fallback a rating). */
  assignGoalScorers(players: Player[], total: number): Record<string, number> {
    const goals: Record<string, number> = {};
    if (players.length === 0 || total <= 0) return goals;

    // Mismo peso que la implementación original en producción: disparo + bonus por posición.
    const weightFor = (p: Player): number =>
      (p.stats?.shooting ?? 5) + (p.position === 'FWD' ? 15 : p.position === 'MID' ? 8 : 0);

    const totalWeight = players.reduce((s, p) => s + weightFor(p), 0);
    if (totalWeight <= 0) return goals;

    for (let g = 0; g < total; g++) {
      let r = Math.random() * totalWeight;
      for (const p of players) {
        r -= weightFor(p);
        if (r <= 0) {
          goals[p.id] = (goals[p.id] ?? 0) + 1;
          break;
        }
      }
    }
    return goals;
  }

  /** Distribuye asistencias ponderadas por passing. */
  assignAssists(
    players: Player[],
    total: number,
    goalScorers: Record<string, number>,
  ): Record<string, number> {
    const assists: Record<string, number> = {};
    if (players.length === 0 || total <= 0) return assists;

    const weightFor = (p: Player): number =>
      (p.stats?.passing ?? 5) + (p.position === 'MID' ? 10 : p.position === 'FWD' ? 5 : 0);

    for (let a = 0; a < total; a++) {
      const options = players.filter((p) => (goalScorers[p.id] ?? 0) === 0);
      const pool = options.length > 0 ? options : players;
      const totalWeight = pool.reduce((s, p) => s + weightFor(p), 0);
      if (totalWeight <= 0) break;

      let r = Math.random() * totalWeight;
      for (const p of pool) {
        r -= weightFor(p);
        if (r <= 0) {
          assists[p.id] = (assists[p.id] ?? 0) + 1;
          break;
        }
      }
    }
    return assists;
  }

  /** Calcula matchRating (1-10), goles y asistencias para cada titular. */
  computeMatchSummary(team: Team, goals: number): PlayerMatchStats[] {
    const starters = team.starters;
    if (starters.length === 0) return [];

    const goalScorers = this.assignGoalScorers(starters, goals);
    const totalAssists = Math.min(2, goals);
    const assistantIds = this.assignAssists(starters, totalAssists, goalScorers);

    return starters.map((p) => {
      const base = (p.rating ?? 50) / 10; // OVR → base sobre 10
      const perf = Math.random() * 1.4 - 0.8; // rendimiento: -0.8 .. +0.6
      const goalBonus = Math.min(1.5, (goalScorers[p.id] ?? 0) * 0.7);
      const assistBonus = (assistantIds[p.id] ?? 0) * 0.3;
      const matchRating = Math.min(
        10,
        Math.max(1, Math.round((base + perf + goalBonus + assistBonus) * 10) / 10),
      );

      return {
        playerId: p.id,
        name: p.name,
        position: p.position,
        rating: p.rating ?? 50,
        matchRating,
        goals: goalScorers[p.id] ?? 0,
        assists: assistantIds[p.id] ?? 0,
      };
    });
  }

  /**
   * Simula un partido completo y devuelve el resultado con resumen por jugador.
   * Si hay empate, se resuelve con penales ponderados por rating.
   */
  simulateMatch(
    homeTeam: Team,
    awayTeam: Team,
  ): MatchSimulationResult {
    const homeRating = this.averageTeamRating(homeTeam);
    const awayRating = this.averageTeamRating(awayTeam);
    const ratingDiff = homeRating - awayRating;

    const homeLambda = this.expectedGoals(homeRating, awayRating);
    const awayLambda = this.expectedGoals(awayRating, homeRating);

    const homeScore = Math.min(7, this.poissonRandom(homeLambda));
    const awayScore = Math.min(7, this.poissonRandom(awayLambda));

    let winnerId = homeScore > awayScore ? homeTeam.id : awayTeam.id;

    // Empate → tanda de penales ponderada.
    if (homeScore === awayScore) {
      const homeWinProb = this.penaltyWinProbability(ratingDiff);
      winnerId = Math.random() < homeWinProb ? homeTeam.id : awayTeam.id;
    }

    const summary: MatchSummary = {
      home: this.computeMatchSummary(homeTeam, homeScore),
      away: this.computeMatchSummary(awayTeam, awayScore),
    };

    return { homeScore, awayScore, winnerId, summary };
  }
}

export const matchSimulation = new MatchSimulation();
