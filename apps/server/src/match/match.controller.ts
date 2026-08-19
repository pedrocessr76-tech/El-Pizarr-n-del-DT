import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';

class CreateTournamentDto {
  @ApiProperty({ example: 'team-uuid', description: 'ID del equipo del usuario' })
  userTeamId!: string;

  @ApiProperty({ example: 'user-uuid', required: false, description: 'ID del usuario (opcional)' })
  userId?: string;

  @ApiProperty({ example: 'session-uuid', required: false, description: 'ID de sesión invitado (opcional)' })
  sessionId?: string;
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
    return this.matchService.createTournament(body.userTeamId, body.userId, body.sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de torneos de un usuario (o sesión invitado)' })
  getHistory(@Query('userId') userId?: string, @Query('sessionId') sessionId?: string) {
    return this.matchService.getHistory(userId, sessionId);
  }

  @Post('tournament/simulate-match')
  @ApiOperation({ summary: 'Simular un partido del torneo y persistir resultado.' })
  @ApiBody({ type: SimulateMatchDto })
  simulateMatch(@Body() body: SimulateMatchDto) {
    return this.matchService.simulateMatch(body.matchId);
  }

  @Post('tournament/:id/advance')
  @ApiOperation({ summary: 'Avanzar la llave: simula los partidos IA de la ronda actual y genera la siguiente ronda.' })
  advanceTournament(@Param('id') id: string) {
    return this.matchService.advanceTournament(id);
  }

  @Post('tournament/:id/complete')
  @ApiOperation({ summary: 'Marcar un torneo como finalizado (por derrota o abandono).' })
  completeTournament(@Param('id') id: string) {
    return this.matchService.completeTournament(id);
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
