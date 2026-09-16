import { MatchSimulation, matchSimulation } from './match-simulation';
import type { Player, Team } from '../../../../packages/shared/types/models';

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: overrides.id ?? 'player-1',
    name: overrides.name ?? 'Test Player',
    nationality: overrides.nationality ?? 'ARG',
    position: overrides.position ?? 'MID',
    rating: overrides.rating ?? 75,
    stats: {
      pace: 70,
      shooting: 70,
      passing: 70,
      dribbling: 70,
      defending: 70,
      physical: 70,
      ...overrides.stats,
    },
  };
}

function makeTeam(overrides: Partial<Team>): Team {
  return {
    id: overrides.id ?? 'team-1',
    name: overrides.name ?? 'Test Team',
    starters: overrides.starters ?? [],
    substitutes: overrides.substitutes ?? [],
  };
}

describe('MatchSimulation - averageTeamRating', () => {
  it('calcula el rating promedio de los titulares', () => {
    const team = makeTeam({
      starters: [
        makePlayer({ id: 'p1', rating: 80 }),
        makePlayer({ id: 'p2', rating: 85 }),
        makePlayer({ id: 'p3', rating: 90 }),
      ],
    });
    expect(matchSimulation.averageTeamRating(team)).toBe(85);
  });

  it('devuelve 50 cuando no hay titulares', () => {
    const team = makeTeam({ starters: [] });
    expect(matchSimulation.averageTeamRating(team)).toBe(50);
  });
});

describe('MatchSimulation - poissonRandom', () => {
  it('siempre devuelve un número entero no negativo', () => {
    for (let i = 0; i < 100; i++) {
      const result = matchSimulation.poissonRandom(1.5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('con lambda alto tiende a producir más goles (promedio estadístico)', () => {
    const lowLambda = 0.3;
    const highLambda = 3.0;
    const lowResults = Array.from({ length: 200 }, () => matchSimulation.poissonRandom(lowLambda));
    const highResults = Array.from({ length: 200 }, () => matchSimulation.poissonRandom(highLambda));

    const lowAvg = lowResults.reduce((a, b) => a + b, 0) / lowResults.length;
    const highAvg = highResults.reduce((a, b) => a + b, 0) / highResults.length;

    expect(highAvg).toBeGreaterThan(lowAvg);
    expect(highAvg).toBeGreaterThan(1.5);
  });
});

describe('MatchSimulation - expectedGoals', () => {
  it('±12 puntos de rating ≈ ±1 gol', () => {
    const base = matchSimulation.expectedGoals(75, 75);
    expect(base).toBeCloseTo(1.5, 5);

    const higher = matchSimulation.expectedGoals(87, 75);
    expect(higher).toBeCloseTo(2.5, 5);

    const muchHigher = matchSimulation.expectedGoals(99, 75);
    expect(muchHigher).toBeCloseTo(3.5, 5);
  });

  it('nunca devuelve menos de 0.25', () => {
    const result = matchSimulation.expectedGoals(50, 99);
    expect(result).toBe(0.25);
  });
});

describe('MatchSimulation - penaltyWinProbability', () => {
  it('con rating diferencial 0 → 0.5', () => {
    expect(matchSimulation.penaltyWinProbability(0)).toBe(0.5);
  });

  it('con rating diferencial +4 → 0.6', () => {
    expect(matchSimulation.penaltyWinProbability(4)).toBeCloseTo(0.6, 5);
  });

  it('acotado entre 0.15 y 0.85', () => {
    expect(matchSimulation.penaltyWinProbability(1000)).toBe(0.85);
    expect(matchSimulation.penaltyWinProbability(-1000)).toBe(0.15);
  });
});

describe('MatchSimulation - assignGoalScorers', () => {
  it('devuelve vacío si no hay goles', () => {
    const players = [makePlayer({ id: 'p1' })];
    expect(matchSimulation.assignGoalScorers(players, 0)).toEqual({});
  });

  it('distribuye todos los goles entre los jugadores', () => {
    const players = [
      makePlayer({ id: 'p1', stats: { pace: 70, shooting: 90, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
      makePlayer({ id: 'p2', stats: { pace: 70, shooting: 50, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
    ];
    const goals = matchSimulation.assignGoalScorers(players, 3);
    const totalGoals = Object.values(goals).reduce((a, b) => a + b, 0);
    expect(totalGoals).toBe(3);
  });

  it('prefiere goleadores con higher shooting', () => {
    const highShooting = makePlayer({ id: 'sniper', stats: { pace: 70, shooting: 99, passing: 70, dribbling: 70, defending: 70, physical: 70 } });
    const lowShooting = makePlayer({ id: 'bad', stats: { pace: 70, shooting: 1, passing: 70, dribbling: 70, defending: 70, physical: 70 } });
    const players = [highShooting, lowShooting];

    let sniperGoals = 0;
    for (let i = 0; i < 500; i++) {
      const goals = matchSimulation.assignGoalScorers(players, 1);
      if (goals['sniper']) sniperGoals += goals['sniper'];
    }
    expect(sniperGoals).toBeGreaterThan(400);
  });
});

describe('MatchSimulation - assignAssists', () => {
  it('devuelve vacío si no hay asistencias', () => {
    const players = [makePlayer({ id: 'p1' })];
    expect(matchSimulation.assignAssists(players, 0, {})).toEqual({});
  });

  it('no asiste al mismo jugador que goleó', () => {
    const scorer = makePlayer({ id: 'scorer', stats: { pace: 70, shooting: 90, passing: 70, dribbling: 70, defending: 70, physical: 70 } });
    const assister = makePlayer({ id: 'assister', position: 'MID', stats: { pace: 70, shooting: 50, passing: 90, dribbling: 70, defending: 70, physical: 70 } });
    const players = [scorer, assister];
    const goalScorers = { scorer: 1 };
    const assists = matchSimulation.assignAssists(players, 1, goalScorers);
    expect(assists['scorer']).toBeUndefined();
    expect(assists['assister']).toBe(1);
  });
});

describe('MatchSimulation - computeMatchSummary', () => {
  it('devuelve stats para cada titular', () => {
    const team = makeTeam({ starters: [
      makePlayer({ id: 'p1', rating: 80 }),
      makePlayer({ id: 'p2', rating: 85 }),
    ] });
    const summary = matchSimulation.computeMatchSummary(team, 2);
    expect(summary).toHaveLength(2);
    summary.forEach((stat) => {
      expect(stat.matchRating).toBeGreaterThanOrEqual(1);
      expect(stat.matchRating).toBeLessThanOrEqual(10);
      expect(stat.goals).toBeGreaterThanOrEqual(0);
      expect(stat.assists).toBeGreaterThanOrEqual(0);
      expect(stat.rating).toBeGreaterThanOrEqual(1);
      expect(stat.rating).toBeLessThanOrEqual(99);
    });
  });

  it('el total de goles coincide con el partido', () => {
    const team = makeTeam({ starters: [
      makePlayer({ id: 'p1', stats: { pace: 70, shooting: 90, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
      makePlayer({ id: 'p2', stats: { pace: 70, shooting: 80, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
      makePlayer({ id: 'p3', stats: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
    ] });
    const summary = matchSimulation.computeMatchSummary(team, 3);
    const totalGoals = summary.reduce((s, p) => s + p.goals, 0);
    expect(totalGoals).toBe(3);
  });

  it('devuelve array vacío si no hay titulares', () => {
    const team = makeTeam({ starters: [] });
    expect(matchSimulation.computeMatchSummary(team, 2)).toEqual([]);
  });
});
describe('MatchSimulation - simulateMatch', () => {
  it('devuelve un resultado válido con scores y winnerId', () => {
    const homeTeam = makeTeam({ id: 'home', starters: [
      makePlayer({ id: 'h1', rating: 80, position: 'GK' }),
      makePlayer({ id: 'h2', rating: 85, position: 'DEF' }),
      makePlayer({ id: 'h3', rating: 82, position: 'MID' }),
    ] });
    const awayTeam = makeTeam({ id: 'away', starters: [
      makePlayer({ id: 'a1', rating: 75, position: 'GK' }),
      makePlayer({ id: 'a2', rating: 78, position: 'DEF' }),
      makePlayer({ id: 'a3', rating: 72, position: 'MID' }),
    ] });
    const result = matchSimulation.simulateMatch(homeTeam, awayTeam);
    expect(result.homeScore).toBeGreaterThanOrEqual(0);
    expect(result.homeScore).toBeLessThanOrEqual(7);
    expect(result.awayScore).toBeGreaterThanOrEqual(0);
    expect(result.awayScore).toBeLessThanOrEqual(7);
    expect([homeTeam.id, awayTeam.id]).toContain(result.winnerId);
    expect(result.summary.home).toHaveLength(3);
    expect(result.summary.away).toHaveLength(3);
  });

  it('el winnerId siempre es el equipo ganador (o penales en empate)', () => {
    const homeTeam = makeTeam({ id: 'home', starters: Array.from({ length: 11 }, (_, i) => makePlayer({ id: 'h' + i, rating: 80 })) });
    const awayTeam = makeTeam({ id: 'away', starters: Array.from({ length: 11 }, (_, i) => makePlayer({ id: 'a' + i, rating: 75 })) });
    for (let i = 0; i < 50; i++) {
      const result = matchSimulation.simulateMatch(homeTeam, awayTeam);
      if (result.homeScore > result.awayScore) expect(result.winnerId).toBe(homeTeam.id);
      else if (result.awayScore > result.homeScore) expect(result.winnerId).toBe(awayTeam.id);
      else expect([homeTeam.id, awayTeam.id]).toContain(result.winnerId);
    }
  });

  it('team with much higher rating tends to win more', () => {
    const strongTeam = makeTeam({ id: 'strong', starters: Array.from({ length: 11 }, (_, i) => makePlayer({ id: 's' + i, rating: 95 })) });
    const weakTeam = makeTeam({ id: 'weak', starters: Array.from({ length: 11 }, (_, i) => makePlayer({ id: 'w' + i, rating: 60 })) });
    let strongWins = 0, weakWins = 0;
    for (let i = 0; i < 200; i++) {
      const result = matchSimulation.simulateMatch(strongTeam, weakTeam);
      if (result.winnerId === strongTeam.id) strongWins += 1;
      else weakWins += 1;
    }
    expect(strongWins).toBeGreaterThan(140);
    expect(weakWins).toBeLessThan(60);
  });
});

describe('MatchSimulation - integridad del summary', () => {
  it('suma de goles home+away coincide con score', () => {
    const home = makeTeam({ id: 'home', starters: [
      makePlayer({ id: 'h1', rating: 80, stats: { pace: 70, shooting: 90, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
      makePlayer({ id: 'h2', rating: 85, position: 'FWD', stats: { pace: 70, shooting: 85, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
    ] });
    const away = makeTeam({ id: 'away', starters: [
      makePlayer({ id: 'a1', rating: 75, stats: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
      makePlayer({ id: 'a2', rating: 78, position: 'FWD', stats: { pace: 70, shooting: 80, passing: 70, dribbling: 70, defending: 70, physical: 70 } }),
    ] });
    const result = matchSimulation.simulateMatch(home, away);
    const homeGoals = result.summary.home.reduce((s: number, p: any) => s + p.goals, 0);
    const awayGoals = result.summary.away.reduce((s: number, p: any) => s + p.goals, 0);
    expect(homeGoals).toBe(result.homeScore);
    expect(awayGoals).toBe(result.awayScore);
  });
});