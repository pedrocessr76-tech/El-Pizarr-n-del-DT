import { Injectable } from '@nestjs/common';
import type { Match, Team, Player } from '../../../../packages/shared/types/models';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';

const REAL_TEAMS_DATA = [
  { name: 'Real Madrid', baseRating: 88 },
  { name: 'Manchester City', baseRating: 89 },
  { name: 'Liverpool FC', baseRating: 87 },
  { name: 'FC Barcelona', baseRating: 86 },
  { name: 'Bayern Munich', baseRating: 87 },
  { name: 'Paris Saint-Germain', baseRating: 86 },
  { name: 'Inter Milan', baseRating: 85 },
  { name: 'Arsenal FC', baseRating: 85 },
  { name: 'Bayer Leverkusen', baseRating: 84 },
  { name: 'Atletico Madrid', baseRating: 84 },
  { name: 'Borussia Dortmund', baseRating: 83 },
  { name: 'Juventus', baseRating: 83 },
  { name: 'AC Milan', baseRating: 83 },
  { name: 'Chelsea FC', baseRating: 82 },
  { name: 'Manchester United', baseRating: 82 },
];

@Injectable()
export class MatchService {
  private generatePlayerWithRating(id: string, name: string, rating: number): Player {
    const statValue = Math.max(1, Math.min(99, rating));
    return {
      id,
      name,
      nationality: 'International',
      position: 'MID', // Simplificado para oponentes generados
      stats: {
        pace: statValue,
        shooting: statValue,
        passing: statValue,
        dribbling: statValue,
        defending: statValue,
        physical: statValue,
      },
    };
  }

  private generateRealTeam(teamData: { name: string; baseRating: number }): Team {
    const allPlayers: Player[] = Array.from({ length: 18 }, (_, i) =>
      this.generatePlayerWithRating(`${teamData.name}-p-${i}`, `Jugador ${i + 1}`, teamData.baseRating),
    );

    return {
      id: teamData.name.toLowerCase().replace(/\s+/g, '-'),
      name: teamData.name,
      starters: allPlayers.slice(0, 11),
      substitutes: allPlayers.slice(11),
    };
  }

  private sumTeamStats(team: Team): number {
    return team.starters.reduce((total, player) => {
      return (
        total +
        player.stats.pace +
        player.stats.shooting +
        player.stats.passing +
        player.stats.dribbling +
        player.stats.defending +
        player.stats.physical
      );
    }, 0);
  }

  simulateMatch(homeTeam: Team, awayTeam: Team): Match {
    const userScoreValue = this.sumTeamStats(homeTeam);
    const opponentScoreValue = this.sumTeamStats(awayTeam);

    // Diferencia de medias (aprox / 6 stats / 11 jugadores)
    const scoreDiff = (userScoreValue - opponentScoreValue) / 66;
    
    // Simulación simple de goles basada en la diferencia de calidad
    let homeScore = Math.max(0, Math.round(Math.random() * 3 + scoreDiff));
    let awayScore = Math.max(0, Math.round(Math.random() * 3 - scoreDiff));

    // En torneos debe haber un ganador (desempate por "penales" si es necesario)
    let winnerId = homeScore > awayScore ? homeTeam.id : homeScore < awayScore ? awayTeam.id : undefined;
    
    if (homeScore === awayScore) {
      // Simular penales: el que tiene mejor media tiene ligera ventaja
      winnerId = Math.random() + (scoreDiff / 10) > 0.5 ? homeTeam.id : awayTeam.id;
    }

    return {
      id: `match-${Date.now()}`,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      status: 'FINISHED',
      winnerId,
    };
  }

  createTournament(userTeam: Team): any {
    const opponents = REAL_TEAMS_DATA.sort(() => 0.5 - Math.random())
      .slice(0, 15)
      .map((t) => this.generateRealTeam(t));

    // Crear bracket inicial (Octavos)
    const allTeams = [userTeam, ...opponents].sort(() => 0.5 - Math.random());
    const octavosMatches: Match[] = [];

    for (let i = 0; i < allTeams.length; i += 2) {
      octavosMatches.push({
        id: `octavos-${i / 2}`,
        homeTeam: allTeams[i],
        awayTeam: allTeams[i + 1],
        homeScore: 0,
        awayScore: 0,
        status: 'PENDING',
      });
    }

    return {
      id: `tourney-${Date.now()}`,
      userTeam,
      opponents,
      rounds: {
        OCTAVOS: octavosMatches,
        CUARTOS: [],
        SEMIS: [],
        FINAL: [],
      },
      currentRound: 'OCTAVOS',
      status: 'IN_PROGRESS',
    };
  }
}
