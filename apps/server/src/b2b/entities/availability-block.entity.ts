import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('b2b_availability_blocks')
@Index(['courtId', 'startsAt', 'endsAt'])
export class B2bAvailabilityBlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  courtId!: string;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'timestamptz' })
  endsAt!: Date;

  @Column({ length: 240 })
  reason!: string;

  @Column({ type: 'uuid' })
  createdBy!: string;
}