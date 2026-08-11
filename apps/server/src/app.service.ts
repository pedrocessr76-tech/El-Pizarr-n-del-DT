import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from './player/player.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
  ) {}

  getHello(): string {
    return 'Hola desde NestJS';
  }

  async getPlayerPositions(): Promise<Array<{ position: string; count: number }>> {
    return this.playerRepo
      .createQueryBuilder('p')
      .select('p.position')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.position')
      .orderBy('p.position')
      .getRawMany();
  }
}
