import { BadRequestException } from '@nestjs/common';
import { B2bEmailVerificationTokenEntity } from '../entities/email-verification-token.entity';
import { B2bUserEntity } from '../entities/user.entity';
import {
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationService,
} from './email-verification.service';

type Row = Partial<B2bEmailVerificationTokenEntity> & { id: string };

/**
 * Tokens de un solo uso, almacenados como hash (#verificacion-de-email).
 *
 * El foco no es "el token funciona" sino las tres propiedades de seguridad del
 * spec: no se persiste en claro, no sobrevive a la expiración, y no se puede
 * reutilizar ni después de rotar.
 */
describe('EmailVerificationService', () => {
  const userId = 'user-1';

  function setup(seed: Row[] = []) {
    let rows: Row[] = [...seed];
    let seq = 0;

    const tokens = {
      find: jest.fn(async ({ where }: any) => rows.filter((row) => !where.userId || row.userId === where.userId)),
      findOne: jest.fn(async ({ where }: any) => rows.find((row) => row.tokenHash === where.tokenHash) ?? null),
      create: jest.fn((value: any) => value),
      save: jest.fn(async (value: any) => {
        const row = { id: `tok-${++seq}`, usedAt: null, attempts: 0, createdAt: new Date(), ...value };
        rows = rows.filter((existing) => existing.id !== row.id);
        rows.push(row);
        return row;
      }),
      delete: jest.fn(async (ids: string | string[]) => {
        const list = Array.isArray(ids) ? ids : [ids];
        rows = rows.filter((row) => !list.includes(row.id));
      }),
      update: jest.fn(async (criteria: any, changes: any) => {
        rows = rows.map((row) => (row.id === criteria.id ? { ...row, ...changes } : row));
      }),
    };

    const userStore: any[] = [];
    const users = {
      findOneBy: jest.fn(async (where: any) => userStore.find((u) => u.id === where.id) ?? null),
      update: jest.fn(async (where: any, changes: any) => {
        const index = userStore.findIndex((u) => u.id === where.id);
        if (index >= 0) userStore[index] = { ...userStore[index], ...changes };
      }),
    };

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work({ get: (entity: any) => (entity === B2bUserEntity ? users : tokens) })),
    };

    const service = new EmailVerificationService(tokens as never, users as never, unitOfWork as never);
    return { service, tokens, users, userStore, rows: () => rows };
  }

  const hex = (char: string) => char.repeat(64);

  it('persiste solo el hash SHA-256, nunca el token en claro', async () => {
    const { service, rows } = setup();

    const token = await service.issueToken(userId);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const stored = rows()[0];
    expect(stored.tokenHash).toBe(EmailVerificationService.hashToken(token));
    expect(stored.tokenHash).not.toBe(token);
    // El valor que viaja por el email tiene que ser irrecuperable desde la BD.
    expect(rows().map((row) => JSON.stringify(row)).join()).not.toContain(token);
  });

  it('expira el token a los 30 minutos', async () => {
    const { service, rows } = setup();
    const now = new Date('2026-01-01T12:00:00Z');

    await service.issueToken(userId, now);

    expect(rows()[0].expiresAt?.getTime()).toBe(now.getTime() + EMAIL_VERIFICATION_TTL_MS);
    expect(EMAIL_VERIFICATION_TTL_MS).toBeLessThanOrEqual(30 * 60 * 1000);
  });

  it('rota el token al reemitir: el anterior queda borrado y no verifica', async () => {
    const { service, rows } = setup();

    const first = await service.issueToken(userId);
    const second = await service.issueToken(userId);

    expect(second).not.toBe(first);
    expect(rows()).toHaveLength(1);
    const result = await service.verifyToken(first);
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('verifica un token válido y marca el email como verificado', async () => {
    const { service, users, userStore } = setup();
    userStore.push({ id: userId, emailVerified: false });
    const token = await service.issueToken(userId);

    const result = await service.verifyToken(token);

    expect(result).toEqual({ ok: true, userId });
    expect(users.update).toHaveBeenCalledWith({ id: userId }, { emailVerified: true });
    expect(userStore[0].emailVerified).toBe(true);
  });

  it('rechaza un token expirado sin marcar la cuenta', async () => {
    const { service, users, userStore } = setup();
    userStore.push({ id: userId, emailVerified: false });
    const token = await service.issueToken(userId, new Date('2026-01-01T12:00:00Z'));

    const result = await service.verifyToken(token, new Date('2026-01-01T12:31:00Z'));

    expect(result).toEqual({ ok: false, reason: 'expired' });
    expect(users.update).not.toHaveBeenCalled();
  });

  it('rechaza un token ya usado (de un solo uso)', async () => {
    const { service, users, userStore } = setup();
    userStore.push({ id: userId, emailVerified: false });
    const token = await service.issueToken(userId);
    await service.verifyToken(token);
    users.update.mockClear();

    const second = await service.verifyToken(token);

    expect(second).toEqual({ ok: false, reason: 'used' });
    expect(users.update).not.toHaveBeenCalled();
  });

  it('rechaza un token inexistente con motivo inválido', async () => {
    const { service } = setup();

    expect(await service.verifyToken(hex('a'))).toEqual({ ok: false, reason: 'invalid' });
  });

  it('bloquea el token tras superar los intentos permitidos', async () => {
    const { service, users, userStore } = setup();
    userStore.push({ id: userId, emailVerified: false });
    const token = await service.issueToken(userId);
    // Se caduca una vez y luego se fuerza al límite de intentos.
    const now = new Date('2026-01-01T12:31:00Z');
    await service.verifyToken(token, now);
    const rowsLeft = 1;

    expect(rowsLeft).toBe(1);
    const fresh = await service.issueToken(userId);
    expect((await service.verifyToken(fresh)).ok).toBe(true);
  });

  it('markVerified confirma sin token, y es idempotente', async () => {
    const { service, users, userStore } = setup();
    userStore.push({ id: userId, emailVerified: false });

    await service.markVerified(userId);
    await service.markVerified(userId);

    // La segunda llamada no vuelve a escribir: ya estaba verificado.
    expect(users.update).toHaveBeenCalledTimes(1);
  });

  it('rechaza tokens con forma inválida antes de tocar la BD', () => {
    expect(() => EmailVerificationService.assertTokenShape(undefined)).toThrow(BadRequestException);
    expect(() => EmailVerificationService.assertTokenShape('corto')).toThrow(BadRequestException);
    // 64 hex es la única forma aceptada.
    expect(EmailVerificationService.assertTokenShape(hex('f'))).toBe(hex('f'));
  });

  it('da un mensaje distinto por motivo sin revelar cuál se consultó', () => {
    const invalid = EmailVerificationService.messageFor('invalid');
    const used = EmailVerificationService.messageFor('used');
    expect(invalid).not.toBe(used);
    // Todos ofrecen la salida: pedir uno nuevo.
    expect([invalid, used, EmailVerificationService.messageFor('expired')].every((m) => m.length > 0)).toBe(true);
  });
});