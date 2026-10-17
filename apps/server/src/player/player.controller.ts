import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlayerService } from './player.service';
import { PlayerFilters } from './player.repository';

class PlayerFilterDto implements PlayerFilters {
  @ApiPropertyOptional({ description: 'Buscar por nombre (parcial, sin distinguir mayúsculas)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Posición: GK | DEF | MID | FWD', enum: ['GK', 'DEF', 'MID', 'FWD'] })
  @IsOptional()
  @IsIn(['GK', 'DEF', 'MID', 'FWD'])
  position?: string;

  @ApiPropertyOptional({ description: 'Rareza: gold (>=85), silver (75-84), bronze (<75)', enum: ['gold', 'silver', 'bronze'] })
  @IsOptional()
  @IsIn(['gold', 'silver', 'bronze'])
  rarity?: 'gold' | 'silver' | 'bronze';

  @ApiPropertyOptional({ description: 'Rating mínimo (1-99)', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Rating máximo (1-99)', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  maxRating?: number;

  @ApiPropertyOptional({ description: 'Página (1-based). Default: 1', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Jugadores por página (max 100). Default: 48', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@ApiTags('Players')
@Controller('players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener jugadores paginados con filtros server-side (nombre, posición, rareza, rating, página)' })
  @ApiResponse({ status: 200, description: 'Página de jugadores filtrada con metadata de paginación.' })
  findAll(@Query() filters: PlayerFilterDto) {
    return this.playerService.findAll(filters);
  }
}
