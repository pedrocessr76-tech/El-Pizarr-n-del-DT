import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';

class CreateTournamentDto {
  @ApiProperty({ example: 'team-uuid', description: 'ID del equipo del usuario' })
  userTeamId!: string;

  @ApiProperty({ example: 'user-uuid', required: false, description: 'ID del usuario (opcional)' })
  userId?: string;
}

class SimulateMatchDto {
  @ApiProperty({ example: 'match-uuid', description: 'ID del partido a simular' })
  matchId!: string;
}

@Controller('match')
@ApiTags('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('tournament/create')
  @ApiOperation({ summary: 'Crear un torneo desde un equipo persistido.' })
  @ApiBody({ type: CreateTournamentDto })
  createTournament(@Body() body: CreateTournamentDto) {
    return this.matchService.createTournament(body.userTeamId, body.userId);
  }

  @Post('tournament/simulate-match')
  @ApiOperation({ summary: 'Simular un partido del torneo y persistir resultado.' })
  @ApiBody({ type: SimulateMatchDto })
  simulateMatch(@Body() body: SimulateMatchDto) {
    return this.matchService.simulateMatch(body.matchId);
  }

  @Get('tournament/:id')
  @ApiOperation({ summary: 'Obtener el estado actual de un torneo' })
  getTournament(@Param('id') id: string) {
    return this.matchService.getTournament(id);
  }

  @Get('team/:id')
  @ApiOperation({ summary: 'Obtener un equipo con sus jugadores' })
  getTeam(@Param('id') id: string) {
    return this.matchService.getTeamById(id);
  }
}
