import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('b2b_booking_reminders')
@Index(['bookingId', 'minutesBefore'], { unique: true })
export class B2bBookingReminderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'int' })
  minutesBefore!: number;

  @Column({ type: 'varchar', length: 20, default: 'PROCESSING' })
  status!: 'PROCESSING' | 'SENT' | 'SIMULATED' | 'SKIPPED' | 'FAILED';

  @Column({ type: 'int', default: 1 })
  attempts!: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  provider!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
