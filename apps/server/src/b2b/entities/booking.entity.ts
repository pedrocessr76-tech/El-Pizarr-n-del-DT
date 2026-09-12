import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BookingStatus } from './b2b.enums';

@Entity('b2b_bookings')
@Index(['shiftId'], { unique: true, where: '"status" IN (\'PENDING\', \'CONFIRMED\')' })
export class B2bBookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  courtId!: string;

  @Column({ type: 'uuid' })
  shiftId!: string;

  @Column({ type: 'uuid' })
  clientUserId!: string;

  @Column({ type: 'varchar', length: 20, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ type: 'int' })
  priceCentsArs!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}