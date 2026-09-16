import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { AuthService } from './auth.service';

/**
 * Repositorio en memoria: evita depender de PostgreSQL y permite verificar
 * qué se persiste realmente (por ejemplo, que la contraseña nunca viaje en claro).
 */
function makeUserRepo() {
  const users: UserEntity[] = [];
  let sequence = 0;
  return {
    users,
    findOne: jest.fn(async (options: { where: { username?: string; id?: string } }) => {
      const { username, id } = options.where;
      if (username !== undefined) return users.find((user) => user.username === username) ?? null;
      if (id !== undefined) return users.find((user) => user.id === id) ?? null;
      return null;
    }),
    save: jest.fn(async (user: UserEntity) => {
      if (!user.id) {
        sequence += 1;
        user.id = 'user-' + sequence;
      }
      users.push(user);
      return user;
    }),
  };
}

function makeService() {
  const repo = makeUserRepo();
  const jwt = new JwtService({ secret: 'test-secret' });
  const service = new AuthService(repo as unknown as Repository<UserEntity>, jwt);
  return { repo, jwt, service };
}

describe('AuthService - register', () => {
  it('crea el usuario y devuelve un accessToken', async () => {
    const { service, jwt } = makeService();

    const result = await service.register('pedro', 'secreto-123');

    expect(result.user.username).toBe('pedro');
    expect(result.user.id).toBe('user-1');
    expect(typeof result.accessToken).toBe('string');
    const payload = jwt.verify<{ sub: string; username: string }>(result.accessToken);
    expect(payload).toMatchObject({ sub: 'user-1', username: 'pedro' });
  });

  it('nunca persiste la contraseña en texto plano', async () => {
    const { service, repo } = makeService();

    await service.register('pedro', 'secreto-123');

    expect(repo.users).toHaveLength(1);
    expect(repo.users[0].password).not.toBe('secreto-123');
    expect(repo.users[0].password.startsWith('$2')).toBe(true);
    await expect(bcrypt.compare('secreto-123', repo.users[0].password)).resolves.toBe(true);
  });

  it('rechaza un nombre de usuario ya registrado', async () => {
    const { service, repo } = makeService();
    await service.register('pedro', 'secreto-123');

    await expect(service.register('pedro', 'otra-clave')).rejects.toBeInstanceOf(ConflictException);
    expect(repo.users).toHaveLength(1);
  });
});

describe('AuthService - login', () => {
  it('devuelve un accessToken con credenciales válidas', async () => {
    const { service, jwt } = makeService();
    await service.register('pedro', 'secreto-123');

    const result = await service.login('pedro', 'secreto-123');

    expect(result.user.username).toBe('pedro');
    const payload = jwt.verify<{ sub: string; username: string }>(result.accessToken);
    expect(payload).toMatchObject({ sub: 'user-1', username: 'pedro' });
  });

  it('rechaza una contraseña incorrecta', async () => {
    const { service } = makeService();
    await service.register('pedro', 'secreto-123');

    await expect(service.login('pedro', 'clave-incorrecta')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un usuario inexistente', async () => {
    const { service } = makeService();

    await expect(service.login('fantasma', 'secreto-123')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService - getProfile', () => {
  it('devuelve el perfil sin exponer la contraseña', async () => {
    const { service } = makeService();
    const registered = await service.register('pedro', 'secreto-123');

    const profile = await service.getProfile(registered.user.id);

    expect(profile.id).toBe(registered.user.id);
    expect(profile.username).toBe('pedro');
    expect(profile).not.toHaveProperty('password');
  });

  it('rechaza un usuario inexistente', async () => {
    const { service } = makeService();

    await expect(service.getProfile('no-existe')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
