import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchService, Difficulty } from './match.service';
import type { Team } from '../../../../packages/shared/types/models';

class SimulateMatchDto {
  @ApiProperty({
    type: Object,
    description: 'Equipo del usuario con los jugadores seleccionados en la formación.',
  })
  userTeam!: Team;

  @ApiProperty({
    enum: ['EASY', 'MEDIUM', 'HARD', 'LEGENDARY'],
    description: 'Dificultad del partido a simular.',
  })
  difficulty!: Difficulty;
}

@Controller('match')
@ApiTags('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('simulate')
  @ApiOperation({ summary: 'Simular un partido entre el equipo del usuario y un oponente generado.' })
  @ApiBody({ type: SimulateMatchDto })
  @ApiResponse({ status: 200, description: 'Resultado de la simulación del partido.' })
  simulateMatch(@Body() body: SimulateMatchDto) {
    if (!body.userTeam) {
      throw new BadRequestException('userTeam is required');
    }
    if (!body.difficulty) {
      throw new BadRequestException('difficulty is required');
    }
    return this.matchService.simulateMatch(body.userTeam, body.difficulty);
  }
}
