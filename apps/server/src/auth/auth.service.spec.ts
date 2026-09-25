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
  const service = new AuthService(repo as unknown as import('../persistence/repository.port').RepositoryPort<UserEntity>, jwt);
  return { repo, jwt, service };
}

describe('AuthService - getGuestToken', () => {
  it('emite un token anónimo con sub generado por el servidor (prefijo guest-)', async () => {
    const { service } = makeService();

    const result = await service.getGuestToken();

    expect(result.user.username).toBe('Invitado');
    expect(result.user.id.startsWith('guest-')).toBe(true);
    expect(result.accessToken).toBeTruthy();
  });

  it('cada llamada genera una identidad anónima distinta', async () => {
    const { service } = makeService();

    const first = await service.getGuestToken();
    const second = await service.getGuestToken();

    expect(first.user.id).not.toBe(second.user.id);
  });

  it('el payload firmado usa el sub del invitado', async () => {
    const { service, jwt } = makeService();

    const result = await service.getGuestToken();
    const payload = jwt.verify<{ sub: string; username: string }>(result.accessToken);
    expect(payload).toMatchObject({ sub: result.user.id, username: 'Invitado' });
  });
});

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

describe('AuthService - refresh token (issue #17)', () => {
  it('emite un refresh token con claim type=refresh', async () => {
    const { service, jwt } = makeService();

    const registered = await service.register('pedro', 'secreto-123');
    const payload = jwt.verify<{ type?: string }>(registered.refreshToken);
    expect(payload.type).toBe('refresh');
  });

  it('rota el par completo con un refresh token válido de usuario', async () => {
    const { service, jwt } = makeService();
    await service.register('pedro', 'secreto-123');
    const session = await service.login('pedro', 'secreto-123');

    const renewed = await service.refresh(session.refreshToken);

    expect(renewed.user.username).toBe('pedro');
    const renewedAccess = jwt.verify<{ sub: string; username: string; iat: number; exp: number }>(renewed.accessToken);
    expect(renewedAccess).toMatchObject({ sub: 'user-1', username: 'pedro' });
    // El access token es corto (~15 minutos), no de 7 días como antes.
    expect(renewedAccess.exp - renewedAccess.iat).toBe(15 * 60);
    // El refresh rotado sigue siendo utilizable: la sesión se encadena.
    const chain = await service.refresh(renewed.refreshToken);
    expect(chain.user.username).toBe('pedro');
  });

  it('renueva la identidad de un invitado conservando su sub', async () => {
    const { service } = makeService();

    const guest = await service.getGuestToken();
    const renewed = await service.refresh(guest.refreshToken);

    expect(renewed.user.id).toBe(guest.user.id);
    expect(renewed.user.username).toBe('Invitado');
  });

  it('rechaza un access token usado como refresh (faltante claim type)', async () => {
    const { service } = makeService();
    const session = await service.register('pedro', 'secreto-123');

    await expect(service.refresh(session.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un usuario eliminado tras la emisión del refresh', async () => {
    const { service, repo } = makeService();
    const session = await service.register('pedro', 'secreto-123');
    repo.users.length = 0;

    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un refresh token inválido o expirado', async () => {
    const { service, jwt } = makeService();
    const session = await service.register('pedro', 'secreto-123');
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
      throw new Error('expired');
    });

    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
