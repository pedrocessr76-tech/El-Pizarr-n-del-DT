import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from './player.entity';
import type { Player } from '../../../../packages/shared/types/models';

// Filtros server-side para el catálogo de jugadores.
export interface PlayerFilters {
  name?: string; // búsqueda parcial por nombre (case-insensitive)
  position?: string; // GK | DEF | MID | FWD
  rarity?: 'gold' | 'silver' | 'bronze'; // gold >= 85, silver 75-84, bronze < 75
  minRating?: number | string;
  maxRating?: number | string;
}

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
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
    const qb = this.playerRepo.createQueryBuilder('player');

    if (filters.name && filters.name.trim()) {
      qb.andWhere('player.name ILIKE :name', { name: `%${filters.name.trim()}%` });
    }

    if (filters.position) {
      qb.andWhere('player.position = :position', { position: filters.position });
    }

    if (filters.rarity) {
      if (filters.rarity === 'gold') {
        qb.andWhere('player.rating >= 85');
      } else if (filters.rarity === 'silver') {
        qb.andWhere('player.rating >= 75 AND player.rating < 85');
      } else {
        qb.andWhere('player.rating < 75');
      }
    }

    const minRating = filters.minRating == null ? NaN : Number(filters.minRating);
    if (!Number.isNaN(minRating)) {
      qb.andWhere('player.rating >= :minRating', { minRating });
    }

    const maxRating = filters.maxRating == null ? NaN : Number(filters.maxRating);
    if (!Number.isNaN(maxRating)) {
      qb.andWhere('player.rating <= :maxRating', { maxRating });
    }

    qb.orderBy('player.rating', 'DESC');
    const players = await qb.getMany();
    return players.map((p) => this.toPlayer(p));
  }
}
