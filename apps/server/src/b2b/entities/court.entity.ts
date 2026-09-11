import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { B2bRecordStatus } from './b2b.enums';

@Entity('b2b_courts')
@Index(['facilityId', 'name'], { unique: true })
export class B2bCourtEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  facilityId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50, default: 'FUTBOL' })
  sportType!: string;

  @Column({ type: 'int', default: 10 })
  capacity!: number;

  @Column({ type: 'varchar', length: 20, default: B2bRecordStatus.ACTIVE })
  status!: B2bRecordStatus;

  @Column({ type: 'int', default: 0 })
  defaultPriceCentsArs!: number;
}