import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type BookingPaymentType = 'DEPOSIT' | 'FULL';
export type BookingPaymentMethod = 'MERCADO_PAGO' | 'TRANSFER';

@Entity('b2b_booking_payment_proofs')
@Index(['bookingId'], { unique: true })
export class B2bBookingPaymentProofEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'uuid' })
  uploadedBy!: string;

  @Column({ type: 'varchar', length: 16 })
  paymentType!: BookingPaymentType;

  @Column({ type: 'varchar', length: 20 })
  paymentMethod!: BookingPaymentMethod;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'varchar', length: 40 })
  contentType!: string;

  @Column({ type: 'bytea' })
  fileData!: Buffer;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt!: Date;
}