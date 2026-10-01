import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Token de un solo uso para verificar el email (#verificacion-de-email).
 *
 * Nunca se guarda el token en claro: la BD solo conoce `tokenHash`, un SHA-256
 * en hex de 64 caracteres. El valor que viaja por email vive únicamente en
 * memoria mientras se redacta el mensaje, así que perder la BD no sirve para
 * robar una verificación.
 */
@Entity('b2b_email_verification_tokens')
@Index(['tokenHash'], { unique: true })
@Index(['userId', 'usedAt'])
export class B2bEmailVerificationTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  /** SHA-256 en hex del token. Índice único: dos tokens nunca colisionan. */
  @Column({ type: 'varchar', length: 64 })
  tokenHash!: string;

  /** 30 minutos desde la emisión (spec: expiración ≤ 30 min). */
  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  /** null = vigente. Sellado al verificar, para que no se reutilice. */
  @Column({ type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  /** Intentos fallidos de verificación, para cortar fuerza bruta sobre el hash. */
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}