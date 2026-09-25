import { Injectable } from '@nestjs/common';
import { PlayerService } from './player/player.service';

@Injectable()
export class AppService {
  constructor(private readonly players: PlayerService) {}

  getHello(): string {
    return 'Hola desde NestJS';
  }

  async getPlayerPositions(): Promise<Array<{ position: string; count: number }>> {
    return this.players.positionCounts();
  }
}
