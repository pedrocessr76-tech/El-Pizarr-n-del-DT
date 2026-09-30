import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { UserEntity } from '../user/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PivotController } from './pivot.controller';
import { PivotService } from './pivot.service';

@Module({
  imports: [RepositoryPortModule.forFeature([UserEntity]), NotificationsModule],
  controllers: [PivotController],
  providers: [PivotService],
})
export class PivotModule {}
