import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('b2b_pivot_requests')
@Index(['requesterUserId', 'lastMessageAt'])
@Index(['pivotUserId', 'lastMessageAt'])
@Index(['bookingId', 'pivotUserId'], { unique: true })
export class B2bPivotRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  requesterUserId!: string;

  @Column({ type: 'uuid' })
  requesterOrganizationId!: string;

  @Column({ type: 'uuid' })
  pivotUserId!: string;

  @Column({ type: 'uuid' })
  pivotOrganizationId!: string;

  @Column({ type: 'uuid', nullable: true })
  bookingId!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: 'PENDING' | 'ACCEPTED' | 'DECLINED';

  @Column({ type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastMessageAt!: Date;
}