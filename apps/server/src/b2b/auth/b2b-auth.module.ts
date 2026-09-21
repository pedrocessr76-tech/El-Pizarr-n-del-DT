import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { requireB2bJwtSecret } from '../../config/env';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bRoleEntity } from '../entities/role.entity';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bAuthController } from './b2b-auth.controller';
import { B2bAuthService } from './b2b-auth.service';
import { B2bJwtStrategy } from './b2b-jwt.strategy';
import { B2bRolesGuard } from './b2b-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([B2bOrganizationEntity, B2bRoleEntity, B2bUserEntity, B2bUserRoleEntity, B2bCourtEntity], 'b2b'),
    PassportModule,
    JwtModule.register({ secret: requireB2bJwtSecret(), signOptions: { expiresIn: '7d' } }),
  ],
  controllers: [B2bAuthController],
  providers: [B2bAuthService, B2bJwtStrategy, B2bRolesGuard],
  exports: [B2bAuthService, B2bRolesGuard],
})
export class B2bAuthModule {}