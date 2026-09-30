import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PivotService } from './pivot.service';

const PLAYER_POSITIONS = ['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MD', 'MI', 'MCO', 'ED', 'EI', 'SD', 'DC'];

class UpdatePivotProfileDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() available?: boolean;
  @ApiProperty({ enum: ['GOALKEEPER', 'FIELD', 'BOTH'], required: false })
  @IsOptional() @IsIn(['GOALKEEPER', 'FIELD', 'BOTH']) role?: string;
  @ApiProperty({ enum: PLAYER_POSITIONS, isArray: true, required: false })
  @IsOptional() @IsArray() @IsIn(PLAYER_POSITIONS, { each: true }) positions?: string[];
}

class ContactPivotDto {
  @ApiProperty({ required: false, maxLength: 300 })
  @IsOptional() @IsString() @MaxLength(300) message?: string;
}

@Controller('pivots')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Pivotes')
export class PivotController {
  constructor(private readonly pivots: PivotService) {}

  @Get('me')
  @ApiOperation({ summary: 'Ver el perfil pivote de la cuenta actual' })
  getMyProfile(@Request() req: any) { return this.pivots.getMyProfile(req.user.id); }

  @Patch('me')
  @ApiOperation({ summary: 'Configurar disponibilidad y posiciones favoritas del perfil pivote' })
  updateMyProfile(@Body() body: UpdatePivotProfileDto, @Request() req: any) {
    return this.pivots.updateMyProfile(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar jugadores pivote disponibles por posición' })
  listAvailable(@Request() req: any, @Query('position') position?: string) {
    return this.pivots.listAvailable(req.user.id, position);
  }

  @Post(':userId/contact')
  @ApiOperation({ summary: 'Enviar una solicitud de contacto a un jugador pivote' })
  contact(@Param('userId') targetUserId: string, @Body() body: ContactPivotDto, @Request() req: any) {
    return this.pivots.contact(req.user.id, targetUserId, body.message);
  }
}
