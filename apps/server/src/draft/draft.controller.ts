import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DraftService } from './draft.service';

class SelectPlayerDto {
  @ApiProperty({ example: 'player-1', description: 'ID del jugador' })
  playerId!: string;
}

class AddPlayerToTeamDto {
  @ApiProperty({ example: 'team-uuid', description: 'ID del equipo' })
  teamId!: string;

  @ApiProperty({ example: 'player-uuid', description: 'ID del jugador' })
  playerId!: string;
}

class CreateTeamDto {
  @ApiProperty({ example: 'user-uuid', description: 'ID del usuario (opcional)', required: false })
  userId?: string;
}

@Controller('draft')
@ApiTags('Draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Get('pack')
  @ApiOperation({ summary: 'Obtener un sobre aleatorio de 5 jugadores desde la DB' })
  @ApiResponse({ status: 200, description: 'Sobre de jugadores generado.' })
  getPack() {
    return this.draftService.getPack();
  }

  @Post('select')
  @ApiOperation({ summary: 'Verificar que un jugador existe en la DB' })
  @ApiBody({ type: SelectPlayerDto })
  selectPlayer(@Body() body: SelectPlayerDto) {
    return this.draftService.selectPlayer(body.playerId);
  }

  @Post('team')
  @ApiOperation({ summary: 'Crear un nuevo equipo vacío' })
  @ApiBody({ type: CreateTeamDto })
  createTeam(@Body() body: CreateTeamDto) {
    return this.draftService.createTeam(body.userId);
  }

  @Post('team/player')
  @ApiOperation({ summary: 'Agregar un jugador al equipo (máx 11 titulares)' })
  @ApiBody({ type: AddPlayerToTeamDto })
  addPlayerToTeam(@Body() body: AddPlayerToTeamDto) {
    return this.draftService.addPlayerToTeam(body.teamId, body.playerId);
  }

  @Delete('team/:teamId/player/:playerId')
  @ApiOperation({ summary: 'Eliminar un jugador del equipo' })
  removePlayerFromTeam(@Param('teamId') teamId: string, @Param('playerId') playerId: string) {
    return this.draftService.removePlayerFromTeam(teamId, playerId);
  }
}
