import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../../persistence/repository-port.module';
import { B2bAuthModule } from '../auth/b2b-auth.module';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bBookingEntity } from '../entities/booking.entity';
import { B2bShiftEntity } from '../entities/shift.entity';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bNotificationsModule } from '../notifications/b2b-notifications.module';
import { B2bPivotController } from './b2b-pivot.controller';
import { B2bPivotService } from './b2b-pivot.service';
import { B2bPivotRequestEntity } from './b2b-pivot-request.entity';
import { B2bPivotMessageEntity } from './b2b-pivot-message.entity';
import { B2bNotificationsGateway } from '../notifications/b2b-notifications.gateway';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    RepositoryPortModule.forFeature([
      B2bUserEntity,
      B2bPivotRequestEntity,
      B2bPivotMessageEntity,
      B2bBookingEntity,
      B2bShiftEntity,
      B2bCourtEntity,
      B2bOrganizationEntity,
    ], 'b2b'),
    B2bAuthModule,
    B2bNotificationsModule,
    MessagingModule,
  ],
  controllers: [B2bPivotController],
  providers: [B2bPivotService],
  exports: [B2bPivotService],
})
export class B2bPivotModule {}
