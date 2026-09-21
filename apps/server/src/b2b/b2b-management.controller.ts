import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { B2bRoles, CurrentB2bUser } from './auth/b2b-auth.decorators';
import { B2bJwtGuard } from './auth/b2b-jwt.guard';
import { B2bRolesGuard } from './auth/b2b-roles.guard';
import { B2bJwtUser } from './auth/b2b-auth.types';
import { BookingStatus, B2bRoleCode, B2bRecordStatus } from './entities/b2b.enums';
import { B2bManagementService } from './b2b-management.service';

class FacilityDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) address?: string;
}
class CourtDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(40) sportType?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) capacity?: number;
  @ApiProperty() @IsInt() @Min(0) defaultPriceCentsArs!: number;
}
class OrganizationUpdateDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) address?: string;
}
class FacilityUpdateDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) address?: string;
  @ApiProperty({ required: false, enum: B2bRecordStatus }) @IsOptional() @IsIn([B2bRecordStatus.ACTIVE, B2bRecordStatus.INACTIVE]) status?: string;
}
class CourtUpdateDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(40) sportType?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) capacity?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) defaultPriceCentsArs?: number;
  @ApiProperty({ required: false, enum: B2bRecordStatus }) @IsOptional() @IsIn([B2bRecordStatus.ACTIVE, B2bRecordStatus.INACTIVE]) status?: string;
}
class ShiftRuleDto {
  @ApiProperty({ description: '0 = domingo ... 6 = sábado' }) @IsInt() @Min(0) @Max(6) weekday!: number;
  @ApiProperty({ example: '09:00' }) @IsString() @IsNotEmpty() startTime!: string;
  @ApiProperty({ example: '21:00' }) @IsString() @IsNotEmpty() endTime!: string;
  @ApiProperty({ enum: [1, 2] }) @IsIn([1, 2]) durationHours!: 1 | 2;
  @ApiProperty() @IsInt() @Min(0) priceCentsArs!: number;
}
class BlockDto {
  @ApiProperty({ example: '2026-01-05T13:00:00Z' }) @IsString() @IsNotEmpty() startsAt!: string;
  @ApiProperty({ example: '2026-01-05T15:00:00Z' }) @IsString() @IsNotEmpty() endsAt!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) reason!: string;
}
class BookingDto {
  @ApiProperty() @IsString() @IsNotEmpty() courtId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() shiftId!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
class ShiftGenerationDto {
  @ApiProperty({ example: '2026-01-05' }) @IsString() @IsNotEmpty() from!: string;
  @ApiProperty({ example: '2026-01-11' }) @IsString() @IsNotEmpty() to!: string;
}
class RescheduleDto {
  @ApiProperty() @IsString() @IsNotEmpty() shiftId!: string;
}

@Controller('api/v1')
@ApiTags('B2B Operations')
@ApiBearerAuth()
@UseGuards(B2bJwtGuard, B2bRolesGuard)
export class B2bManagementController {
  constructor(private readonly service: B2bManagementService) {}

  @Get('organizations/me') getOrganization(@CurrentB2bUser() user: B2bJwtUser) { return this.service.getOrganization(user); }
  @Patch('organizations/me') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN) updateOrganization(@CurrentB2bUser() user: B2bJwtUser, @Body() body: OrganizationUpdateDto) { return this.service.updateOrganization(user, body); }

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
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post('courts/:courtId/shifts/generate') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) generateShifts(@CurrentB2bUser() user: B2bJwtUser, @Param('courtId') courtId: string, @Body() body: ShiftGenerationDto) { return this.service.generateShifts(user, courtId, body); }
  @Get('availability') availability(@CurrentB2bUser() user: B2bJwtUser, @Query('courtId') courtId: string, @Query('from') from: string, @Query('to') to: string) { return this.service.availability(user, courtId, from, to); }
  @Get('bookings') listBookings(@CurrentB2bUser() user: B2bJwtUser) { return this.service.listBookings(user); }
  @Get('metrics/summary') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) metricsSummary(@CurrentB2bUser() user: B2bJwtUser, @Query('date') date?: string) { return this.service.metricsSummary(user, date ? new Date(date) : new Date()); }
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('bookings') createBooking(@CurrentB2bUser() user: B2bJwtUser, @Body() body: BookingDto) { return this.service.createBooking(user, body); }
  @Post('bookings/:id/confirm') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) confirm(@CurrentB2bUser() user: B2bJwtUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.transitionBooking(user, id, BookingStatus.CONFIRMED); }
  @Post('bookings/:id/cancel') cancel(@CurrentB2bUser() user: B2bJwtUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.transitionBooking(user, id, BookingStatus.CANCELLED); }
  @Post('bookings/:id/reschedule') reschedule(@CurrentB2bUser() user: B2bJwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: RescheduleDto) { return this.service.rescheduleBooking(user, id, body.shiftId); }
  @Post('bookings/:id/complete') @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR) complete(@CurrentB2bUser() user: B2bJwtUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.transitionBooking(user, id, BookingStatus.COMPLETED); }
}