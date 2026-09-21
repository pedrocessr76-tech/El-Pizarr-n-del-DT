import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { B2bJwtGuard } from '../auth/b2b-jwt.guard';
import { B2bRolesGuard } from '../auth/b2b-roles.guard';
import { B2bRoles, CurrentB2bUser } from '../auth/b2b-auth.decorators';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { B2bRoleCode } from '../entities/b2b.enums';
import { B2bNotificationsService } from './b2b-notifications.service';

class AnnouncementDto {
  @ApiProperty({ example: 'Torneo relámpago este sábado' }) title!: string;
  @ApiProperty({ example: 'Inscribite en recepción. Cupos limitados.' }) body!: string;
}

@Controller('api/v1/notifications')
@ApiTags('B2B Notifications')
@ApiBearerAuth()
@UseGuards(B2bJwtGuard)
export class B2bNotificationsController {
  constructor(private readonly service: B2bNotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de notificaciones del usuario actual' })
  list(@CurrentB2bUser() user: B2bJwtUser) {
    return this.service.listForUser(user);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  markRead(@CurrentB2bUser() user: B2bJwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markRead(user, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones del usuario como leídas' })
  markAllRead(@CurrentB2bUser() user: B2bJwtUser) {
    return this.service.markAllRead(user);
  }

  @Post()
  @UseGuards(B2bRolesGuard)
  @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR)
  @ApiOperation({ summary: 'Publicar un aviso general del complejo (staff)' })
  announce(@CurrentB2bUser() user: B2bJwtUser, @Body() body: AnnouncementDto) {
    const title = body.title?.trim();
    const text = body.body?.trim();
    if (!title || title.length < 3 || title.length > 120) {
      throw new BadRequestException('El título del aviso debe tener entre 3 y 120 caracteres');
    }
    if (!text || text.length > 500) {
      throw new BadRequestException('El aviso debe tener entre 1 y 500 caracteres');
    }
    return this.service.broadcastToOrganization(
      user.organizationId,
      {
        type: 'b2b_org_announcement',
        severity: 'info',
        title,
        body: text,
      },
      user.userId,
    );
  }
}