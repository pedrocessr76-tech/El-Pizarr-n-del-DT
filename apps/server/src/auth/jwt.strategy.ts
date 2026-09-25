import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { requireJwtSecret } from '../config/env';
import { UserEntity } from '../user/user.entity';
import { RepositoryPort, getRepositoryPortToken } from '../persistence/repository.port';
import { GUEST_ID_PREFIX } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(getRepositoryPortToken(UserEntity))
    private readonly userRepo: RepositoryPort<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: { sub: string; username: string }) {
    // Invitados: el sub lo generó el servidor (`guest-<uuid>`) y no existe fila
    // en la tabla de usuarios; se acepta sin lookup contra la DB.
    if (payload.sub.startsWith(GUEST_ID_PREFIX)) {
      return { id: payload.sub, username: payload.username ?? 'Invitado' };
    }
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, username: user.username };
  }
}
