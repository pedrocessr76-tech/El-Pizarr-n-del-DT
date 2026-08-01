import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

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

    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username },
    };
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

    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    return { id: user.id, username: user.username, createdAt: user.createdAt };
  }
}
