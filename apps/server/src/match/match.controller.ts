import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchService } from './match.service';

class CreateTournamentDto {
  @ApiProperty({ example: 'team-uuid', description: 'ID del equipo del usuario del token' })
  @IsString()
  @IsNotEmpty()
  userTeamId!: string;
}

class SimulateMatchDto {
  @ApiProperty({ example: 'match-uuid', description: 'ID del partido a simular' })
  @IsString()
  @IsNotEmpty()
  matchId!: string;
}

@Controller('match')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  /**
   * Idéntidad siempre del token. userId/sessionId en body/query se RECHAZAN (IDOR).
   */
  private assertNoSpoofedIdentity(input: unknown): void {
    const fields = (input ?? {}) as Record<string, unknown>;
    const spoofed = fields.userId ?? fields.sessionId;
    if (spoofed !== undefined && spoofed !== null && spoofed !== '') {
      throw new BadRequestException(
        'userId/sessionId no pueden enviarse desde el cliente: la identidad se toma del token.',
      );
    }
  }

  @Post('tournament/create')
  @ApiOperation({ summary: 'Crear un torneo desde un equipo persistido del usuario del token.' })
  @ApiBody({ type: CreateTournamentDto })
  @ApiBadRequestResponse({ description: 'Equipo ajeno o identidad spoofeada en el body.' })
  createTournament(@Body() body: CreateTournamentDto, @Request() req: any) {
    this.assertNoSpoofedIdentity(body);
    return this.matchService.createTournament(body.userTeamId, req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de torneos de la identidad del token' })
  @ApiBadRequestResponse({ description: 'userId/sessionId enviados por query.' })
  getHistory(@Query() query: Record<string, unknown>, @Request() req: any) {
    this.assertNoSpoofedIdentity(query);
    return this.matchService.getHistory(req.user.id);
  }

  @Post('tournament/simulate-match')
  @ApiOperation({ summary: 'Simular un partido del torneo y persistir el resultado.' })
  @ApiBody({ type: SimulateMatchDto })
  simulateMatch(@Body() body: SimulateMatchDto, @Request() req: any) {
    return this.matchService.simulateMatch(body.matchId, req.user.id);
  }

  @Post('tournament/:id/advance')
  @ApiOperation({ summary: 'Avanzar la llave: simula los partidos IA de la ronda actual y genera la siguiente ronda.' })
  advanceTournament(@Param('id') id: string, @Request() req: any) {
    return this.matchService.advanceTournament(id, req.user.id);
  }

  @Post('tournament/:id/complete')
  @ApiOperation({ summary: 'Marcar un torneo como finalizado (por derrota o abandono).' })
  completeTournament(@Param('id') id: string, @Request() req: any) {
    return this.matchService.completeTournament(id, req.user.id);
  }

  @Get('tournament/:id')
  @ApiOperation({ summary: 'Obtener el estado actual de un torneo propio' })
  getTournament(@Param('id') id: string, @Request() req: any) {
    return this.matchService.getTournament(id, req.user.id);
  }

  @Get('team/:id')
  @ApiOperation({ summary: 'Obtener un equipo propio (o un rival IA) con sus jugadores' })
  getTeam(@Param('id') id: string, @Request() req: any) {
    return this.matchService.getTeamByIdForUser(id, req.user.id);
  }
}
