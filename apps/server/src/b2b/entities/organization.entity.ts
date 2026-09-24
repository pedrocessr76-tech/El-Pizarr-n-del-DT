import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { B2bRecordStatus } from './b2b.enums';

@Entity('b2b_organizations')
export class B2bOrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ length: 80 })
  slug!: string;

  @Column({ type: 'varchar', length: 40, default: B2bRecordStatus.ACTIVE })
  status!: B2bRecordStatus;

  @Column({ length: 64, default: 'America/Argentina/Buenos_Aires' })
  timezone!: string;

  @Column({ length: 3, default: 'ARS' })
  currency!: string;

  /** Teléfono de WhatsApp de la organización normalizado a E.164 (#37). */
  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsappPhone!: string | null;

  /** Consentimiento explícito de la organización para recibir avisos por WhatsApp (#37). */
  @Column({ type: 'boolean', default: false })
  whatsappOptIn!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}