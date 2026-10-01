import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../../persistence/repository-port.module';
import { B2bAuthModule } from '../auth/b2b-auth.module';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bNotificationsModule } from '../notifications/b2b-notifications.module';
import { B2bPivotController } from './b2b-pivot.controller';
import { B2bPivotService } from './b2b-pivot.service';

@Module({
  imports: [
    RepositoryPortModule.forFeature([B2bUserEntity], 'b2b'),
    B2bAuthModule,
    B2bNotificationsModule,
  ],
  controllers: [B2bPivotController],
  providers: [B2bPivotService],
  exports: [B2bPivotService],
})
export class B2bPivotModule {}
