import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Canal por el que se emite el recordatorio. `whatsapp` no se envía solo. */
export type ReminderChannel = 'email' | 'whatsapp';

/**
 * `AWAITING_MANUAL` distingue el aviso que espera que el staff lo despache desde
 * el dashboard (#34) de uno enviado por el servidor: el processor no reintenta
 * los que esperan, y el panel los ofrece una sola vez.
 */
export type ReminderStatus = 'PROCESSING' | 'AWAITING_MANUAL' | 'SENT' | 'SIMULATED' | 'SKIPPED' | 'FAILED';

@Entity('b2b_booking_reminders')
@Index(['bookingId', 'channel', 'minutesBefore'], { unique: true })
export class B2bBookingReminderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'varchar', length: 20, default: 'whatsapp' })
  channel!: ReminderChannel;

  @Column({ type: 'int' })
  minutesBefore!: number;

  @Column({ type: 'varchar', length: 20, default: 'PROCESSING' })
  status!: ReminderStatus;

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
