import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from '../match/entities/match.entity';
import { TournamentEntity } from '../match/entities/tournament.entity';
import type { Player } from '../../../../packages/shared/types/models';

export interface PlayerPack {
  players: Player[];
}

@Injectable()
export class DraftService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamPlayerEntity)
    private readonly teamPlayerRepo: Repository<TeamPlayerEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(TournamentEntity)
    private readonly tournamentRepo: Repository<TournamentEntity>,
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

  async getPack(position?: string): Promise<PlayerPack> {
    const count = await this.playerRepo.count();
    if (count === 0) {
      return { players: [] };
    }

    // Si no hay posición específica, devolver 5 jugadores aleatorios
    if (!position || position === 'ANY') {
      const randomPlayers = await this.playerRepo
        .createQueryBuilder('p')
        .orderBy('RANDOM()')
        .take(5)
        .getMany();
      return { players: randomPlayers.map((p) => this.toPlayer(p)) };
    }

    // Mapeo de posiciones compatibles
    const compatiblePositions: Record<string, string[]> = {
      'POR': ['POR'],
      'LD': ['LD', 'DFC'],
      'LI': ['LI', 'DFC'],
      'DFC': ['DFC', 'LD', 'LI'],
      'MCD': ['MCD', 'MC', 'MCO'],
      'MC': ['MC', 'MCD', 'MCO'],
      'MCO': ['MCO', 'MC', 'MCD'],
      'MD': ['MD', 'ED', 'MC'],
      'MI': ['MI', 'EI', 'MC'],
      'ED': ['ED', 'MD', 'EI', 'SD'],
      'EI': ['EI', 'MI', 'ED', 'SD'],
      'SD': ['SD', 'DC', 'ST', 'ED', 'EI'],
      'DC': ['DC', 'ST', 'SD'],
      'ST': ['ST', 'DC', 'SD'],
    };

    const positionsToSearch = compatiblePositions[position.toUpperCase()] || [position.toUpperCase()];
    
    // Obtener jugadores de la posición y posiciones compatibles
    const players = await this.playerRepo
      .createQueryBuilder('p')
      .where('UPPER(p.position) IN (:...positions)', { positions: positionsToSearch })
      .orderBy('RANDOM()')
      .take(5)
      .getMany();

    return { players: players.map((p) => this.toPlayer(p)) };
  }

  async selectPlayer(playerId: string): Promise<{ success: boolean; player: Player | null; message: string }> {
    const playerEntity = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!playerEntity) {
      throw new NotFoundException('Jugador no encontrado en la base de datos.');
    }

    const player = this.toPlayer(playerEntity);
    return {
      success: true,
      player,
      message: 'Jugador encontrado. Listo para seleccionar.',
    };
  }

  async createTeam(userId?: string, sessionId?: string): Promise<{ teamId: string }> {
    // 1) Sesión invitado: reusar equipo existente de esta sesión
    if (sessionId && !userId) {
      const existing = await this.teamRepo.findOne({ where: { sessionId } });
      if (existing) return { teamId: existing.id };
    }

    // 2) Usuario logueado adopta equipo invitado (login en mitad de sesión)
    if (userId && sessionId) {
      const sessionTeam = await this.teamRepo.findOne({ where: { sessionId } });
      if (sessionTeam) {
        sessionTeam.userId = userId;
        sessionTeam.sessionId = null;
        await this.teamRepo.save(sessionTeam);
        return { teamId: sessionTeam.id };
      }
    }

    // 3) Usuario logueado: reusar su último equipo (evita "más de un mi equipo")
    if (userId) {
      const existing = await this.teamRepo.findOne({ where: { userId, isReal: false }, order: { createdAt: 'DESC' } });
      if (existing) return { teamId: existing.id };
    }

    // 4) Crear equipo nuevo
    const team = new TeamEntity();
    team.id = crypto.randomUUID();
    team.name = 'Mi Equipo';
    team.userId = userId;
    team.sessionId = sessionId;
    team.isReal = false; // El equipo del usuario nunca es un oponente IA real
    await this.teamRepo.save(team);
    return { teamId: team.id };
  }

  async cleanupSession(sessionId: string): Promise<{ success: boolean; cleaned: number }> {
    const teams = await this.teamRepo.find({ where: { sessionId } });
    const teamIds = teams.map(t => t.id);
    if (teamIds.length === 0) return { success: true, cleaned: 0 };

    // Torneos del invitado
    const tournaments = await this.tournamentRepo.find({ where: { userTeamId: In(teamIds) } });
    const tournamentIds = tournaments.map(t => t.id);
    if (tournamentIds.length) {
      await this.matchRepo.delete({ tournamentId: In(tournamentIds) });
      await this.tournamentRepo.delete(tournamentIds);
    }

    // Equipo y sus jugadores
    await this.teamPlayerRepo.delete({ teamId: In(teamIds) });
    await this.teamRepo.delete(teamIds);

    return { success: true, cleaned: teamIds.length };
  }

  async addPlayerToTeam(teamId: string, playerId: string, isStarter = true): Promise<{ success: boolean; message: string }> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Jugador no encontrado.');
    }

    const existing = await this.teamPlayerRepo.findOne({ where: { teamId, playerId } });
    if (existing) {
      throw new BadRequestException('El jugador ya está en el equipo.');
    }

    const starterCount = await this.teamPlayerRepo.count({ where: { teamId, isStarter: true } });
    const substituteCount = await this.teamPlayerRepo.count({ where: { teamId, isStarter: false } });

    // Validación de plantilla máxima (11 titulares + 7 suplentes = 18)
    if (starterCount + substituteCount >= 18) {
      throw new BadRequestException('El equipo ya tiene 18 jugadores (11 titulares + 7 suplentes).');
    }

    if (isStarter) {
      if (starterCount >= 11) {
        throw new BadRequestException('El equipo ya tiene 11 jugadores titulares.');
      }
    } else {
      if (substituteCount >= 7) {
        throw new BadRequestException('El equipo ya tiene 7 jugadores suplentes.');
      }
    }

    const tp = new TeamPlayerEntity();
    tp.teamId = teamId;
    tp.playerId = playerId;
    tp.isStarter = isStarter;
    tp.slotIndex = isStarter ? starterCount : substituteCount;
    await this.teamPlayerRepo.save(tp);

    return { success: true, message: isStarter ? 'Jugador agregado al equipo.' : 'Suplente agregado al equipo.' };
  }

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<{ success: boolean; message: string }> {
    const tp = await this.teamPlayerRepo.findOne({ where: { teamId, playerId } });
    if (!tp) {
      throw new NotFoundException('El jugador no está en el equipo.');
    }

    await this.teamPlayerRepo.remove(tp);
    return { success: true, message: 'Jugador eliminado del equipo.' };
  }
}
