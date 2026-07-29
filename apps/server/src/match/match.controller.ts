import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import type { Team } from '../../../../packages/shared/types/models';

class CreateTournamentDto {
  @ApiProperty({
    type: Object,
    description: 'Equipo del usuario con los jugadores seleccionados.',
  })
  userTeam!: Team;
}

class SimulateTournamentMatchDto {
  @ApiProperty({ type: Object })
  homeTeam!: Team;
  @ApiProperty({ type: Object })
  awayTeam!: Team;
}

@Controller('match')
@ApiTags('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('tournament/create')
  @ApiOperation({ summary: 'Crear un nuevo torneo de octavos de final.' })
  @ApiBody({ type: CreateTournamentDto })
  createTournament(@Body() body: CreateTournamentDto) {
    if (!body.userTeam) {
      throw new BadRequestException('userTeam is required');
    }
    return this.matchService.createTournament(body.userTeam);
  }

  @Post('tournament/simulate-match')
  @ApiOperation({ summary: 'Simular un partido específico del torneo.' })
  @ApiBody({ type: SimulateTournamentMatchDto })
  simulateMatch(@Body() body: SimulateTournamentMatchDto) {
    if (!body.homeTeam || !body.awayTeam) {
      throw new BadRequestException('homeTeam and awayTeam are required');
    }
    return this.matchService.simulateMatch(body.homeTeam, body.awayTeam);
  }
}
