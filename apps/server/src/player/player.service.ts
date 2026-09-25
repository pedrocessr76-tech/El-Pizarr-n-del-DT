import { Inject, Injectable } from '@nestjs/common';
import type { Player } from '../../../../packages/shared/types/models';
import { PlayerCatalogRepository, PlayerFilters, PLAYER_CATALOG_REPOSITORY } from './player.repository';
import { PlayerEntity } from './player.entity';

@Injectable()
export class PlayerService {
  constructor(
    @Inject(PLAYER_CATALOG_REPOSITORY)
    private readonly playerRepo: PlayerCatalogRepository,
  ) {}

  private toPlayer(entity: PlayerEntity): Player {
    return {
      id: entity.id,
      name: entity.name,
      nationality: entity.nationality,
      position: entity.position as Player['position'],
      rating: entity.rating,
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

  async findAll(filters: PlayerFilters = {}): Promise<Player[]> {
    const players = await this.playerRepo.findCatalog(filters);
    return players.map((p) => this.toPlayer(p));
  }

  async positionCounts(): Promise<Array<{ position: string; count: number }>> {
    return this.playerRepo.countByPosition();
  }
}
