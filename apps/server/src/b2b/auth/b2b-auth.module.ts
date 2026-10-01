import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RepositoryPortModule } from '../../persistence/repository-port.module';
import { requireB2bJwtSecret } from '../../config/env';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bRoleEntity } from '../entities/role.entity';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bEmailVerificationTokenEntity } from '../entities/email-verification-token.entity';
import { B2bFacilityEntity } from '../entities/facility.entity';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { MessagingModule } from '../messaging/messaging.module';
import { B2bAuthController } from './b2b-auth.controller';
import { B2bAuthService } from './b2b-auth.service';
import { B2bJwtStrategy } from './b2b-jwt.strategy';
import { B2bRolesGuard } from './b2b-roles.guard';
import { DisposableEmailService } from './disposable-email.service';
import { EmailVerificationMailer } from './email-verification.mailer';
import { EmailVerificationService } from './email-verification.service';

@Module({
  imports: [
    RepositoryPortModule.forFeature([B2bOrganizationEntity, B2bRoleEntity, B2bUserEntity, B2bUserRoleEntity, B2bCourtEntity, B2bFacilityEntity, B2bEmailVerificationTokenEntity], 'b2b'),
    PassportModule,
    // El email de verificación sale por el mismo canal que los recordatorios
    // de #34, así que depende de su módulo.
    MessagingModule,
    JwtModule.register({
      secret: requireB2bJwtSecret(),
      // Access token corto; la sesión larga la renueva el refresh token en
      // cookie HttpOnly (issue #17).
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [B2bAuthController],
  providers: [
    B2bAuthService,
    B2bJwtStrategy,
    B2bRolesGuard,
    // La lista de dominios llega por factory: es configuración de entorno, no un
    // tipo resoluble por Nest.
    {
      provide: DisposableEmailService,
      useFactory: () => new DisposableEmailService(process.env.B2B_DISPOSABLE_EMAIL_DOMAINS),
    },
    EmailVerificationMailer,
    EmailVerificationService,
  ],
  exports: [B2bAuthService, B2bRolesGuard, EmailVerificationService],
})
export class B2bAuthModule {}
