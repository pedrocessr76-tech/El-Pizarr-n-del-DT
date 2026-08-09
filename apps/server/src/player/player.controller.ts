import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import type { Player } from '../../../../packages/shared/types/models';

@ApiTags('Players')
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los jugadores de la base de datos' })
  @ApiResponse({ status: 200, description: 'Lista de jugadores.' })
  findAll(): Promise<Player[]> {
    return this.playerService.findAll();
  }
}
