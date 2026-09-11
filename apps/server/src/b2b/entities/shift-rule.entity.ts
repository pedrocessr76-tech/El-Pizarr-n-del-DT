import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('b2b_shift_rules')
@Index(['courtId', 'weekday', 'startTime'], { unique: true })
export class B2bShiftRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  courtId!: string;

  @Column({ type: 'smallint' })
  weekday!: number;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'smallint' })
  durationHours!: 1 | 2;

  @Column({ type: 'int' })
  priceCentsArs!: number;

  @Column({ default: true })
  active!: boolean;
}