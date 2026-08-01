import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from './entities/match.entity';
import type { Match, Team, Player, Tournament, RoundName } from '../../../../packages/shared/types/models';

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
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamPlayerEntity)
    private readonly teamPlayerRepo: Repository<TeamPlayerEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
  ) {}

  private toPlayer(entity: PlayerEntity): Player {
    return {
      id: entity.id,
      name: entity.name,
      nationality: entity.nationality,
      position: entity.position as Player['position'],
      stats: {
        pace: entity.pace,
        shooting: entity.shooting,
        passing: entity.passing,
        dribbling: entity.dribbling,
        defending: entity.defending,
        physical: entity.physical,
      },
    };
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    const teamEntity = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!teamEntity) return null;

    const teamPlayers = await this.teamPlayerRepo.find({
      where: { teamId },
      order: { slotIndex: 'ASC' },
    });

    const playerIds = teamPlayers.map((tp) => tp.playerId);
    const playerEntities = await this.playerRepo.find({ where: { id: In(playerIds) } });
    const playerMap = new Map(playerEntities.map((p) => [p.id, this.toPlayer(p)]));

    const starters: Player[] = [];
    const substitutes: Player[] = [];

    for (const tp of teamPlayers) {
      const player = playerMap.get(tp.playerId);
      if (player) {
        if (tp.isStarter) {
          starters.push(player);
        } else {
          substitutes.push(player);
        }
      }
    }

    return {
      id: teamEntity.id,
      name: teamEntity.name,
      starters,
      substitutes,
    };
  }

  private generatePlayerWithRating(id: string, name: string, rating: number): Player {
    const statValue = Math.max(1, Math.min(99, rating));
    return {
      id,
      name,
      nationality: 'International',
      position: 'MID',
      stats: { pace: statValue, shooting: statValue, passing: statValue, dribbling: statValue, defending: statValue, physical: statValue },
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
      return total + player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defending + player.stats.physical;
    }, 0);
  }

  async simulateMatch(matchId: string): Promise<Match> {
    const matchEntity = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!matchEntity) throw new NotFoundException('Partido no encontrado.');

    const homeTeam = await this.getTeamById(matchEntity.homeTeamId);
    const awayTeam = await this.getTeamById(matchEntity.awayTeamId);
    if (!homeTeam || !awayTeam) throw new NotFoundException('Equipo no encontrado.');

    const homeScoreValue = this.sumTeamStats(homeTeam);
    const awayScoreValue = this.sumTeamStats(awayTeam);
    const scoreDiff = (homeScoreValue - awayScoreValue) / 66;

    const homeScore = Math.max(0, Math.round(Math.random() * 3 + scoreDiff));
    const awayScore = Math.max(0, Math.round(Math.random() * 3 - scoreDiff));

    let winnerId = homeScore > awayScore ? homeTeam.id : homeScore < awayScore ? awayTeam.id : undefined;

    if (homeScore === awayScore) {
      winnerId = Math.random() + (scoreDiff / 10) > 0.5 ? homeTeam.id : awayTeam.id;
    }

    matchEntity.homeScore = homeScore;
    matchEntity.awayScore = awayScore;
    matchEntity.status = 'FINISHED';
    matchEntity.winnerId = winnerId;
    await this.matchRepo.save(matchEntity);

    return {
      id: matchEntity.id,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      status: 'FINISHED',
      winnerId,
    };
  }

  async createTournament(userTeamId: string, userId?: string): Promise<Tournament> {
    const userTeam = await this.getTeamById(userTeamId);
    if (!userTeam) throw new NotFoundException('Equipo de usuario no encontrado.');

    const opponents = REAL_TEAMS_DATA.sort(() => 0.5 - Math.random())
      .slice(0, 15)
      .map((t) => this.generateRealTeam(t));

    const allTeams = [userTeam, ...opponents].sort(() => 0.5 - Math.random());
    const tournamentId = crypto.randomUUID();
    const matches: Match[] = [];

    for (let i = 0; i < allTeams.length; i += 2) {
      const matchEntity = new MatchEntity();
      matchEntity.id = crypto.randomUUID();
      matchEntity.tournamentId = tournamentId;
      matchEntity.round = 'OCTAVOS';
      matchEntity.userId = userId;
      matchEntity.homeTeamId = allTeams[i].id;
      matchEntity.awayTeamId = allTeams[i + 1].id;
      matchEntity.homeScore = 0;
      matchEntity.awayScore = 0;
      matchEntity.status = 'PENDING';
      await this.matchRepo.save(matchEntity);

      matches.push({
        id: matchEntity.id,
        homeTeam: allTeams[i],
        awayTeam: allTeams[i + 1],
        homeScore: 0,
        awayScore: 0,
        status: 'PENDING',
      });
    }

    return {
      id: tournamentId,
      userTeam,
      opponents,
      rounds: { OCTAVOS: matches, CUARTOS: [], SEMIS: [], FINAL: [] },
      currentRound: 'OCTAVOS',
      status: 'IN_PROGRESS',
    };
  }

  async getTournament(tournamentId: string): Promise<{ rounds: Record<string, MatchEntity[]> }> {
    const matches = await this.matchRepo.find({ where: { tournamentId } });
    const rounds: Record<string, MatchEntity[]> = {};
    for (const m of matches) {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    }
    return { rounds };
  }
}
