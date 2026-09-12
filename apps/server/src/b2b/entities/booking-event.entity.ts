import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('b2b_booking_events')
@Index(['bookingId', 'createdAt'])
export class B2bBookingEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'uuid' })
  actorUserId!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fromStatus!: string | null;

  @Column({ length: 20 })
  toStatus!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}