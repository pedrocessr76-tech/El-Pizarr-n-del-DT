import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserEntity } from '../user/user.entity';
import { RepositoryPort, getRepositoryPortToken } from '../persistence/repository.port';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, REFRESH_TOKEN_TYPE } from './tokens';

export const GUEST_ID_PREFIX = 'guest-';

/** Payload que firman el access y el refresh token del juego. */
type GameTokenPayload = { sub: string; username: string };

@Injectable()
export class AuthService {
  constructor(
    @Inject(getRepositoryPortToken(UserEntity))
    private readonly userRepo: RepositoryPort<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Access token corto (en memoria en el cliente) + refresh token de 7d que va
   * en cookie HttpOnly (issue #17): el XSS ya no puede robar la sesión desde
   * localStorage/sessionStorage.
   */
  private signAccessToken(payload: GameTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  private signRefreshToken(payload: GameTokenPayload): string {
    return this.jwtService.sign({ ...payload, type: REFRESH_TOKEN_TYPE }, { expiresIn: REFRESH_TOKEN_TTL });
  }

  private buildTokens(payload: GameTokenPayload) {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
      user: { id: payload.sub, username: payload.username },
    };
  }

  /**
   * Identidad anónima para el modo invitado. El `sub` lo genera el SERVIDOR
   * (uuid aleatorio con prefijo `guest-`), nunca el cliente: así el backend
   * autoriza sólo por el token firmado y no por un `sessionId` injectable.
   */
  async getGuestToken() {
    const id = GUEST_ID_PREFIX + crypto.randomUUID();
    return this.buildTokens({ sub: id, username: 'Invitado' });
  }

  async register(username: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserEntity();
    user.username = username;
    user.password = hashedPassword;
    await this.userRepo.save(user);

    return this.buildTokens({ sub: user.id, username: user.username });
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.buildTokens({ sub: user.id, username: user.username });
  }

  /**
   * Renueva la sesión a partir del refresh token (cookie HttpOnly). Acepta
   * sólo tokens de tipo `type: 'refresh'` y rota el par completo. Para un
   * usuario real revalida que siga existiendo; para invitado re-emite la misma
   * identidad anónima.
   */
  async refresh(refreshToken: string) {
    let payload: GameTokenPayload & { type?: string };
    try {
      payload = this.jwtService.verify<GameTokenPayload & { type?: string }>(refreshToken);
    } catch {
      throw new UnauthorizedException('La sesión expiró. Iniciá sesión nuevamente.');
    }
    if (payload.type !== REFRESH_TOKEN_TYPE) {
      throw new UnauthorizedException('Token de refresco inválido.');
    }

    if (payload.sub.startsWith(GUEST_ID_PREFIX)) {
      return this.buildTokens({ sub: payload.sub, username: payload.username ?? 'Invitado' });
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Sesión inválida.');
    }
    return this.buildTokens({ sub: user.id, username: user.username });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    return { id: user.id, username: user.username, createdAt: user.createdAt };
  }
}
