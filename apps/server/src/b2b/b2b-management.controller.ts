import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { B2bRoles, CurrentB2bUser } from './auth/b2b-auth.decorators';
import { B2bJwtGuard } from './auth/b2b-jwt.guard';
import { B2bRolesGuard } from './auth/b2b-roles.guard';
import { B2bJwtUser } from './auth/b2b-auth.types';
import { BookingStatus, B2bRoleCode } from './entities/b2b.enums';
import { B2bManagementService } from './b2b-management.service';

class FacilityDto { @ApiProperty() name!: string; @ApiProperty({ required: false }) address?: string; }
class CourtDto { @ApiProperty() name!: string; @ApiProperty({ required: false }) sportType?: string; @ApiProperty({ required: false }) capacity?: number; @ApiProperty() defaultPriceCentsArs!: number; }
class FacilityUpdateDto { @ApiProperty({ required: false }) name?: string; @ApiProperty({ required: false }) address?: string; @ApiProperty({ required: false }) status?: string; }
class CourtUpdateDto { @ApiProperty({ required: false }) name?: string; @ApiProperty({ required: false }) sportType?: string; @ApiProperty({ required: false }) capacity?: number; @ApiProperty({ required: false }) defaultPriceCentsArs?: number; @ApiProperty({ required: false }) status?: string; }
class ShiftRuleDto { @ApiProperty() weekday!: number; @ApiProperty() startTime!: string; @ApiProperty() endTime!: string; @ApiProperty({ enum: [1, 2] }) durationHours!: 1 | 2; @ApiProperty() priceCentsArs!: number; }
class BlockDto { @ApiProperty() startsAt!: string; @ApiProperty() endsAt!: string; @ApiProperty() reason!: string; }
class BookingDto { @ApiProperty() courtId!: string; @ApiProperty() shiftId!: string; @ApiProperty({ required: false }) notes?: string; }
class ShiftGenerationDto { @ApiProperty() from!: string; @ApiProperty() to!: string; }
class RescheduleDto { @ApiProperty() shiftId!: string; }

@Controller('api/v1')
@ApiTags('B2B Operations')
@ApiBearerAuth()
@UseGuards(B2bJwtGuard, B2bRolesGuard)
export class B2bManagementController {
  constructor(private readonly service: B2bManagementService) {}

  @Get('organizations/me') getOrganization(@CurrentB2bUser() user: B2bJwtUser) { return this.service.getOrganization(user); }
  @Patch('organizations/me') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) updateOrganization(@CurrentB2bUser() user: B2bJwtUser, @Body() body: { name?: string; address?: string }) { return this.service.updateOrganization(user, body); }

  @Get('facilities') listFacilities(@CurrentB2bUser() user: B2bJwtUser) { return this.service.listFacilities(user); }
  @Post('facilities') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) createFacility(@CurrentB2bUser() user: B2bJwtUser, @Body() body: FacilityDto) { return this.service.createFacility(user, body); }
  @Patch('facilities/:id') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) updateFacility(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string, @Body() body: FacilityUpdateDto) { return this.service.updateFacility(user, id, body); }
  @Delete('facilities/:id') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) archiveFacility(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string) { return this.service.archiveFacility(user, id); }
  @Post('facilities/:facilityId/courts') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) createCourt(@CurrentB2bUser() user: B2bJwtUser, @Param('facilityId') facilityId: string, @Body() body: CourtDto) { return this.service.createCourt(user, facilityId, body); }
  @Get('courts') listCourts(@CurrentB2bUser() user: B2bJwtUser) { return this.service.listCourts(user); }
  @Patch('courts/:id') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) updateCourt(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string, @Body() body: CourtUpdateDto) { return this.service.updateCourt(user, id, body); }
  @Delete('courts/:id') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) archiveCourt(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string) { return this.service.archiveCourt(user, id); }
  @Post('courts/:courtId/shift-rules') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) createRule(@CurrentB2bUser() user: B2bJwtUser, @Param('courtId') courtId: string, @Body() body: ShiftRuleDto) { return this.service.createShiftRule(user, courtId, body); }
  @Get('courts/:courtId/shift-rules') listRules(@CurrentB2bUser() user: B2bJwtUser, @Param('courtId') courtId: string) { return this.service.listShiftRules(user, courtId); }
  @Post('courts/:courtId/availability-blocks') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) createBlock(@CurrentB2bUser() user: B2bJwtUser, @Param('courtId') courtId: string, @Body() body: BlockDto) { return this.service.createBlock(user, courtId, body); }
  @Post('courts/:courtId/shifts/generate') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) generateShifts(@CurrentB2bUser() user: B2bJwtUser, @Param('courtId') courtId: string, @Body() body: ShiftGenerationDto) { return this.service.generateShifts(user, courtId, body); }
  @Get('availability') availability(@CurrentB2bUser() user: B2bJwtUser, @Query('courtId') courtId: string, @Query('from') from: string, @Query('to') to: string) { return this.service.availability(user, courtId, from, to); }
  @Get('bookings') listBookings(@CurrentB2bUser() user: B2bJwtUser) { return this.service.listBookings(user); }
  @Post('bookings') createBooking(@CurrentB2bUser() user: B2bJwtUser, @Body() body: BookingDto) { return this.service.createBooking(user, body); }
  @Post('bookings/:id/confirm') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) confirm(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string) { return this.service.transitionBooking(user, id, BookingStatus.CONFIRMED); }
  @Post('bookings/:id/cancel') cancel(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string) { return this.service.transitionBooking(user, id, BookingStatus.CANCELLED); }
  @Post('bookings/:id/reschedule') reschedule(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string, @Body() body: RescheduleDto) { return this.service.rescheduleBooking(user, id, body.shiftId); }
  @Post('bookings/:id/complete') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) complete(@CurrentB2bUser() user: B2bJwtUser, @Param('id') id: string) { return this.service.transitionBooking(user, id, BookingStatus.COMPLETED); }
}