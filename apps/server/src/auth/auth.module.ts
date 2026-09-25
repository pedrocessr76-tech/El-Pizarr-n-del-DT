import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { requireJwtSecret } from '../config/env';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [
    UserModule,
    RepositoryPortModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.register({
      secret: requireJwtSecret(),
      // Access token corto: la sesión larga la renueva el refresh token en
      // cookie HttpOnly (issue #17). Los refresh se firman con expiresIn 7d.
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
