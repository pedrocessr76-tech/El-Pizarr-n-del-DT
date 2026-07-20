import { Injectable } from '@nestjs/common';
import type { Match, Team, Player } from '../../../../packages/shared/types/models';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';

@Injectable()
export class MatchService {
  private difficultyMultiplier(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'EASY':
        return 0.8;
      case 'MEDIUM':
        return 1.0;
      case 'HARD':
        return 1.2;
      case 'LEGENDARY':
        return 1.4;
      default:
        return 1.0;
    }
  }

  private sumTeamStats(team: Team): number {
    return team.startingEleven.reduce((total, player) => {
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

  private generateOpponentTeam(userTeam: Team, difficulty: Difficulty): Team {
    const multiplier = this.difficultyMultiplier(difficulty);
    const opponentPlayers: Player[] = userTeam.startingEleven.map((player, index) => {
      const adjustStat = (value: number) => {
        const base = Math.round(value * multiplier);
        return Math.max(1, Math.min(99, base + (index % 5 - 2) * 2));
      };

      return {
        ...player,
        id: `${player.id}-opponent-${index}`,
        name: `Oponente ${index + 1}`,
        stats: {
          pace: adjustStat(player.stats.pace),
          shooting: adjustStat(player.stats.shooting),
          passing: adjustStat(player.stats.passing),
          dribbling: adjustStat(player.stats.dribbling),
          defending: adjustStat(player.stats.defending),
          physical: adjustStat(player.stats.physical),
        },
      };
    });

    return {
      id: `opponent-${difficulty.toLowerCase()}`,
      name: `Equipo Oponente ${difficulty}`,
      startingEleven: opponentPlayers,
    };
  }

  simulateMatch(userTeam: Team, difficulty: Difficulty): Match {
    const opponentTeam = this.generateOpponentTeam(userTeam, difficulty);
    const userScoreValue = this.sumTeamStats(userTeam);
    const opponentScoreValue = this.sumTeamStats(opponentTeam);

    const scoreDiff = Math.round((userScoreValue - opponentScoreValue) / 60);
    const homeScore = Math.max(0, scoreDiff >= 0 ? scoreDiff : 0);
    const awayScore = Math.max(0, scoreDiff < 0 ? -scoreDiff : 0);

    return {
      id: `match-${Date.now()}`,
      homeTeam: userTeam,
      awayTeam: opponentTeam,
      homeScore,
      awayScore,
      status: 'FINISHED',
    };
  }
}
