import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { B2bAuthModule } from '../auth/b2b-auth.module';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bNotificationEntity } from './b2b-notification.entity';
import { B2bNotificationsController } from './b2b-notifications.controller';
import { B2bNotificationsGateway } from './b2b-notifications.gateway';
import { B2bNotificationsService } from './b2b-notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([B2bNotificationEntity, B2bUserRoleEntity, B2bUserEntity], 'b2b'),
    JwtModule.register({
      secret: process.env.B2B_JWT_SECRET || 'sistema-canchas-secret',
    }),
    B2bAuthModule,
  ],
  controllers: [B2bNotificationsController],
  providers: [B2bNotificationsGateway, B2bNotificationsService],
  exports: [B2bNotificationsService],
})
export class B2bNotificationsModule {}