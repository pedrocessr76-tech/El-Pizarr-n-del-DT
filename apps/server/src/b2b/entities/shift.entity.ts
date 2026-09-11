import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ShiftStatus } from './b2b.enums';

@Entity('b2b_shifts')
@Index(['courtId', 'startsAt'], { unique: true })
export class B2bShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  courtId!: string;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'int' })
  priceCentsArs!: number;

  @Column({ type: 'varchar', length: 20, default: ShiftStatus.AVAILABLE })
  status!: ShiftStatus;
}