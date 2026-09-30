import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { B2bRecordStatus } from './b2b.enums';

@Entity('b2b_users')
@Index(['organizationId', 'email'], { unique: true })
export class B2bUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ length: 160 })
  email!: string;

  @Column({ length: 255 })
  passwordHash!: string;

  @Column({ length: 120 })
  fullName!: string;

  /**
   * Verificación obligatoria del email (#verificacion-de-email). El login queda
   * bloqueado mientras sea `false`: la dirección tiene que existir y estar
   * controlada por la persona antes de conceder acceso.
   *
   * La migración arranca en `false` también para las cuentas existentes, sin
   * grace period: son datos de prueba y la decisión fue descartarlas.
   */
  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 20, default: B2bRecordStatus.ACTIVE })
  status!: B2bRecordStatus;

  /** Teléfono de WhatsApp normalizado a E.164 (#37). null = sin WhatsApp configurado. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsappPhone!: string | null;

  /** Consentimiento explícito para recibir mensajes por WhatsApp (#37). */
  @Column({ type: 'boolean', default: false })
  whatsappOptIn!: boolean;

  /** Perfil opt-in de jugador pivote asociado al cliente/jugador del sistema de canchas. */
  @Column({ type: 'boolean', default: false })
  pivotAvailable!: boolean;

  /** GOALKEEPER, FIELD o BOTH; las posiciones favoritas se guardan aparte. */
  @Column({ type: 'varchar', length: 16, default: 'FIELD' })
  pivotRole!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  pivotPositions!: string[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}