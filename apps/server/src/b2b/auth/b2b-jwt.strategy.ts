import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { requireB2bJwtSecret } from '../../config/env';
import { B2bAuthService } from './b2b-auth.service';
import { B2bJwtUser } from './b2b-auth.types';

@Injectable()
export class B2bJwtStrategy extends PassportStrategy(Strategy, 'b2b-jwt') {
  constructor(private readonly authService: B2bAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: requireB2bJwtSecret(),
    });
  }

  /**
   * Los roles y el status del usuario/complejo se REVALIDAN contra la BD en cada
   * petición (no se confían al JWT): si el usuario fue desactivado, cambió de rol
   * o su complejo quedó inactivo, la sesión deja de presentarse de inmediato.
   */
  async validate(payload: B2bJwtUser): Promise<B2bJwtUser> {
    return this.authService.resolveUserFromToken(payload);
  }
}