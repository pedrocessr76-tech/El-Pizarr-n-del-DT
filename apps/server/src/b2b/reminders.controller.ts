import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B2bJwtGuard } from './auth/b2b-jwt.guard';
import { B2bRolesGuard } from './auth/b2b-roles.guard';
import { B2bRoles, CurrentB2bUser } from './auth/b2b-auth.decorators';
import { B2bJwtUser } from './auth/b2b-auth.types';
import { B2bRoleCode } from './entities/b2b.enums';
import { RemindersService } from './reminders.service';

@Controller('api/v1/reminders')
@ApiTags('B2B Reminders')
@ApiBearerAuth()
@UseGuards(B2bJwtGuard, B2bRolesGuard)
@B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR)
export class RemindersController {
  constructor(private readonly service: RemindersService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Avisos de WhatsApp que el personal todavía tiene que despachar' })
  listPending(@CurrentB2bUser() user: B2bJwtUser) {
    return this.service.listPending(user);
  }

  @Post(':id/sent')
  @ApiOperation({ summary: 'Confirmar que el personal despachó el aviso de WhatsApp' })
  markDispatched(@CurrentB2bUser() user: B2bJwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markDispatched(user, id);
  }
}
