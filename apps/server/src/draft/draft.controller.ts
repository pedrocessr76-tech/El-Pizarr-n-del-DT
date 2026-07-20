import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DraftService } from './draft.service';

class SelectPlayerDto {
  @ApiProperty({
    example: 'player-1',
    description: 'ID del jugador que quieres seleccionar del sobre',
  })
  playerId!: string;
}

@Controller('draft')
@ApiTags('Draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Get('pack')
  @ApiOperation({ summary: 'Obtener un sobre aleatorio de jugadores' })
  @ApiResponse({ status: 200, description: 'Sobre de jugadores generado.' })
  getPack() {
    return this.draftService.getPack();
  }

  @Post('select')
  @ApiOperation({ summary: 'Seleccionar un jugador del sobre' })
  @ApiBody({ type: SelectPlayerDto })
  @ApiResponse({ status: 200, description: 'Jugador seleccionado y equipo actualizado.' })
  selectPlayer(@Body() body: SelectPlayerDto) {
    if (!body.playerId) {
      throw new BadRequestException('playerId is required');
    }
    return this.draftService.selectPlayer(body.playerId);
  }
}
