import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bJwtUser } from './b2b-auth.types';

@Injectable()
export class B2bJwtStrategy extends PassportStrategy(Strategy, 'b2b-jwt') {
  constructor(
    @InjectRepository(B2bUserEntity, 'b2b')
    private readonly users: Repository<B2bUserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.B2B_JWT_SECRET || 'sistema-canchas-secret',
    });
  }

  async validate(payload: B2bJwtUser): Promise<B2bJwtUser> {
    const user = await this.users.findOne({
      where: { id: payload.userId, organizationId: payload.organizationId },
    });
    if (!user) throw new UnauthorizedException('Sesión B2B inválida');
    return payload;
  }
}