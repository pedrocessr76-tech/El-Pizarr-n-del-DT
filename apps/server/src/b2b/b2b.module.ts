import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { B2bAvailabilityBlockEntity } from './entities/availability-block.entity';
import { B2bBookingEventEntity } from './entities/booking-event.entity';
import { B2bBookingEntity } from './entities/booking.entity';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bFacilityEntity } from './entities/facility.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bRoleEntity } from './entities/role.entity';
import { B2bShiftRuleEntity } from './entities/shift-rule.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bUserRoleEntity } from './entities/user-role.entity';
import { B2bUserEntity } from './entities/user.entity';
import { B2bAuthModule } from './auth/b2b-auth.module';
import { B2bManagementController } from './b2b-management.controller';
import { B2bManagementService } from './b2b-management.service';
import { B2bSeedService } from './b2b-seed.service';

export const B2B_ENTITIES = [
  B2bOrganizationEntity,
  B2bRoleEntity,
  B2bUserEntity,
  B2bUserRoleEntity,
  B2bFacilityEntity,
  B2bCourtEntity,
  B2bShiftRuleEntity,
  B2bShiftEntity,
  B2bAvailabilityBlockEntity,
  B2bBookingEntity,
  B2bBookingEventEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(B2B_ENTITIES, 'b2b'), B2bAuthModule],
  controllers: [B2bManagementController],
  providers: [B2bManagementService, B2bSeedService],
  exports: [B2bManagementService, TypeOrmModule],
})
export class B2bModule {}