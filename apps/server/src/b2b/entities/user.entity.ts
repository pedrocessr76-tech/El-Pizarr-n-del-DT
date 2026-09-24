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

  @Column({ type: 'varchar', length: 20, default: B2bRecordStatus.ACTIVE })
  status!: B2bRecordStatus;

  /** Teléfono de WhatsApp normalizado a E.164 (#37). null = sin WhatsApp configurado. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsappPhone!: string | null;

  /** Consentimiento explícito para recibir mensajes por WhatsApp (#37). */
  @Column({ type: 'boolean', default: false })
  whatsappOptIn!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}