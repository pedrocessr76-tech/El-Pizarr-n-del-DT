import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { NotificationType, Severity } from '../../../../../packages/shared/types/models';

@Entity('b2b_notifications')
@Index(['recipientUserId', 'createdAt'])
@Index(['recipientUserId', 'read'])
export class B2bNotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  recipientUserId!: string;

  @Column({ type: 'varchar', length: 40 })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 12 })
  severity!: Severity;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  body!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}