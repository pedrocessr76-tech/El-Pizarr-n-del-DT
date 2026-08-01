import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
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

  async getPack(): Promise<PlayerPack> {
    const count = await this.playerRepo.count();
    if (count === 0) {
      return { players: [] };
    }

    const randomPlayers = await this.playerRepo
      .createQueryBuilder('p')
      .orderBy('RANDOM()')
      .take(5)
      .getMany();

    return { players: randomPlayers.map((p) => this.toPlayer(p)) };
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

  async createTeam(userId?: string): Promise<{ teamId: string }> {
    const team = new TeamEntity();
    team.id = crypto.randomUUID();
    team.name = 'Mi Equipo';
    team.userId = userId;
    await this.teamRepo.save(team);
    return { teamId: team.id };
  }

  async addPlayerToTeam(teamId: string, playerId: string): Promise<{ success: boolean; message: string }> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Jugador no encontrado.');
    }

    const currentCount = await this.teamPlayerRepo.count({ where: { teamId, isStarter: true } });
    if (currentCount >= 11) {
      throw new BadRequestException('El equipo ya tiene 11 jugadores titulares.');
    }

    const existing = await this.teamPlayerRepo.findOne({ where: { teamId, playerId } });
    if (existing) {
      throw new BadRequestException('El jugador ya está en el equipo.');
    }

    const tp = new TeamPlayerEntity();
    tp.teamId = teamId;
    tp.playerId = playerId;
    tp.isStarter = true;
    tp.slotIndex = currentCount;
    await this.teamPlayerRepo.save(tp);

    return { success: true, message: 'Jugador agregado al equipo.' };
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
