import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { B2bEmailVerificationTokenEntity } from '../entities/email-verification-token.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2B_UNIT_OF_WORK } from '../../persistence/persistence.module';
import { RepositoryPort, UnitOfWork, getRepositoryPortToken } from '../../persistence/repository.port';

/** 30 minutos, el máximo que fija el spec. */
export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;

/** Cota de intentos fallidos antes de que el token deje de ser verificable. */
const MAX_ATTEMPTS = 10;

export type VerificationFailure = 'invalid' | 'expired' | 'used' | 'locked';

export interface VerificationResult {
  ok: boolean;
  userId?: string;
  reason?: VerificationFailure;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @Inject(getRepositoryPortToken(B2bEmailVerificationTokenEntity, 'b2b')) private readonly tokens: RepositoryPort<B2bEmailVerificationTokenEntity>,
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    @Inject(B2B_UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * SHA-256 en hex. Se persiste solo esto: la BD no conoce el token que viaja
   * por email, así que ni una copia de la base sirve para verificar cuentas.
   */
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Emite un token nuevo e invalida los que el usuario tenía pendientes.
   *
   * La rotación es lo que impide que un token viejo (interceptado, o de un
   * reenvío anterior) siga sirviendo después de que el usuario pida otro.
   * Devuelve el token en claro porque va directo al email; la única copia
   * persistente es su hash.
   */
  async issueToken(userId: string, now = new Date()): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.unitOfWork.execute(async (repositories) => {
      const tokenRepo = repositories.get(B2bEmailVerificationTokenEntity);
      const stale = await tokenRepo.find({ where: { userId } });
      const pending = stale.filter((row) => row.usedAt === null).map((row) => row.id);
      if (pending.length > 0) await tokenRepo.delete(pending);
      await tokenRepo.save(
        tokenRepo.create({
          userId,
          tokenHash: EmailVerificationService.hashToken(token),
          expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
          usedAt: null,
          attempts: 0,
        }),
      );
    });
    return token;
  }

  /**
   * Canjea un token por una cuenta verificada.
   *
   * Nunca lanza por el motivo del fallo: distingue expirado, usado e inválido
   * solo para que el endpoint devuelva un mensaje útil, y siempre en conjunto
   * con la acción de reenviar. Un atacante no gana nada por la diferencia.
   */
  async verifyToken(token: string, now = new Date()): Promise<VerificationResult> {
    const tokenHash = EmailVerificationService.hashToken(token);
    return this.unitOfWork.execute(async (repositories) => {
      const tokenRepo = repositories.get(B2bEmailVerificationTokenEntity);
      const userRepo = repositories.get(B2bUserEntity);
      const row = await tokenRepo.findOne({ where: { tokenHash } });
      if (!row) return { ok: false, reason: 'invalid' as const };
      if (row.usedAt !== null) return { ok: false, reason: 'used' as const };
      if (row.expiresAt.getTime() <= now.getTime()) {
        await tokenRepo.update({ id: row.id }, { attempts: row.attempts + 1 });
        return { ok: false, reason: 'expired' as const };
      }
      if (row.attempts >= MAX_ATTEMPTS) {
        await tokenRepo.update({ id: row.id }, { usedAt: now });
        return { ok: false, reason: 'locked' as const };
      }

      const user = await userRepo.findOneBy({ id: row.userId });
      if (!user) return { ok: false, reason: 'invalid' as const };

      // El sello y el flag van juntos: si el guardado falla, el token sigue
      // vivo en vez de quedar consumido sin haber marcado nada.
      await tokenRepo.update({ id: row.id }, { usedAt: now });
      await userRepo.update({ id: user.id }, { emailVerified: true });
      this.logger.log(`Email verificado para el usuario ${user.id}.`);
      return { ok: true, userId: user.id };
    });
  }

  /** Traduce el fallo interno al mensaje que ve la persona. */
  static messageFor(reason: VerificationFailure): string {
    switch (reason) {
      case 'expired':
        return 'El enlace de verificación venció. Pedí uno nuevo.';
      case 'used':
        return 'Ese enlace ya se usó. Pedí uno nuevo si seguís sin poder entrar.';
      case 'locked':
        return 'Demasiados intentos fallidos. Pedí un enlace nuevo.';
      default:
        return 'El enlace de verificación no es válido.';
    }
  }

  /**
   * Verifica el correo directamente, sin pasar por un token.
   *
   * Lo usa el login con Google del change siguiente: cuando el proveedor
   * declara `email_verified === true` no tiene sentido mandar un mail para
   * probar lo que el proveedor ya acreditó.
   */
  async markVerified(userId: string): Promise<void> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user || user.emailVerified) return;
    await this.users.update({ id: userId }, { emailVerified: true });
    this.logger.log(`Email marcado como verificado por proveedor externo (usuario ${userId}).`);
  }

  /** Normaliza y valida la forma del token que llega por body o query. */
  static assertTokenShape(token: unknown): string {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      throw new BadRequestException('Falta el token de verificación.');
    }
    return token;
  }
}