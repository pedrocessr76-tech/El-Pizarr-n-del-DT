import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DraftService } from './draft.service';

class SelectPlayerDto {
  @ApiProperty({ example: 'player-1', description: 'ID del jugador' })
  @IsString()
  @IsNotEmpty()
  playerId!: string;
}

class AddPlayerToTeamDto {
  @ApiProperty({ example: 'team-uuid', description: 'ID del equipo' })
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @ApiProperty({ example: 'player-uuid', description: 'ID del jugador' })
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @ApiProperty({ example: true, description: 'true = titular, false = suplente', required: false })
  @IsOptional()
  @IsBoolean()
  isStarter?: boolean;
}

/** Body de POST /draft/team: vacío por diseño (la identidad viene del token). */
class CreateTeamDto {}

@Controller('draft')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  /**
   * Idéntidad siempre del token. Si un cliente manda userId/sessionId en el
   * body/query se RECHAZA la petición (IDOR: la identidad jamás viene del cliente).
   */
  private assertNoSpoofedIdentity(input: unknown, query?: Record<string, unknown>): void {
    const body = (input ?? {}) as Record<string, unknown>;
    const spoofed = body.userId ?? body.sessionId ?? query?.userId ?? query?.sessionId;
    if (spoofed !== undefined && spoofed !== null && spoofed !== '') {
      throw new BadRequestException(
        'userId/sessionId no pueden enviarse desde el cliente: la identidad se toma del token.',
      );
    }
  }

  @Get('pack')
  @ApiOperation({ summary: 'Obtener un sobre aleatorio de 5 jugadores desde la DB' })
  @ApiResponse({ status: 200, description: 'Sobre de jugadores generado.' })
  getPack(@Query('position') position?: string) {
    return this.draftService.getPack(position);
  }

  @Post('select')
  @ApiOperation({ summary: 'Verificar que un jugador existe en la DB' })
  @ApiBody({ type: SelectPlayerDto })
  selectPlayer(@Body() body: SelectPlayerDto) {
    return this.draftService.selectPlayer(body.playerId);
  }

  @Post('team')
  @ApiOperation({ summary: 'Crear un nuevo equipo vacío, o reusar el existente del usuario del token' })
  @ApiBody({ type: CreateTeamDto })
  createTeam(@Body() body: CreateTeamDto, @Request() req: any) {
    this.assertNoSpoofedIdentity(body);
    return this.draftService.createTeam(req.user.id);
  }

  @Delete('data')
  @ApiOperation({ summary: 'Limpia todos los datos DE LA IDENTIDAD DEL TOKEN (equipos, torneos, partidos)' })
  cleanupData(@Request() req: any) {
    return this.draftService.cleanupUserData(req.user.id);
  }

  @Post('team/player')
  @ApiOperation({ summary: 'Agregar un jugador al equipo (máx 11 titulares)' })
  @ApiBody({ type: AddPlayerToTeamDto })
  addPlayerToTeam(@Body() body: AddPlayerToTeamDto, @Request() req: any) {
    return this.draftService.addPlayerToTeam(body.teamId, body.playerId, body.isStarter, req.user.id);
  }

  @Delete('team/:teamId/player/:playerId')
  @ApiOperation({ summary: 'Eliminar un jugador del equipo' })
  removePlayerFromTeam(
    @Param('teamId') teamId: string,
    @Param('playerId') playerId: string,
    @Request() req: any,
  ) {
    return this.draftService.removePlayerFromTeam(teamId, playerId, req.user.id);
  }

  @Post('team/:teamId/reset')
  @ApiOperation({ summary: 'Reiniciar el equipo eliminando todos sus jugadores (titulares y suplentes)' })
  resetTeam(@Param('teamId') teamId: string, @Request() req: any) {
    return this.draftService.resetTeam(teamId, req.user.id);
  }
}
