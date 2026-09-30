import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { B2bJwtGuard } from '../auth/b2b-jwt.guard';
import { CurrentB2bUser } from '../auth/b2b-auth.decorators';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { B2bPivotService } from './b2b-pivot.service';

const PLAYER_POSITIONS = ['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MD', 'MI', 'MCO', 'ED', 'EI', 'SD', 'DC'];

class UpdatePivotProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ enum: ['GOALKEEPER', 'FIELD', 'BOTH'], required: false })
  @IsOptional()
  @IsIn(['GOALKEEPER', 'FIELD', 'BOTH'])
  role?: string;

  @ApiProperty({ enum: PLAYER_POSITIONS, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsIn(PLAYER_POSITIONS, { each: true })
  positions?: string[];
}

class ContactPivotDto {
  @ApiProperty({ required: false, maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}

@Controller('api/v1/pivots')
@UseGuards(B2bJwtGuard)
@ApiBearerAuth()
@ApiTags('B2B Pivotes')
export class B2bPivotController {
  constructor(private readonly pivots: B2bPivotService) {}

  @Get('me')
  @ApiOperation({ summary: 'Ver mi perfil de jugador pivote en el Sistema Canchas' })
  getMyProfile(@CurrentB2bUser() user: B2bJwtUser) {
    return this.pivots.getMyProfile(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar disponibilidad y posiciones favoritas del perfil pivote' })
  updateMyProfile(@CurrentB2bUser() user: B2bJwtUser, @Body() body: UpdatePivotProfileDto) {
    return this.pivots.updateMyProfile(user, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar jugadores pivote disponibles para completar partidos' })
  listAvailable(
    @CurrentB2bUser() user: B2bJwtUser,
    @Query('position') position?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.pivots.listAvailable(user, position, organizationId);
  }

  @Post(':userId/contact')
  @ApiOperation({ summary: 'Enviar solicitud de contacto a un jugador pivote' })
  contact(
    @CurrentB2bUser() user: B2bJwtUser,
    @Param('userId') targetUserId: string,
    @Body() body: ContactPivotDto,
  ) {
    return this.pivots.contact(user, targetUserId, body.message);
  }
}
