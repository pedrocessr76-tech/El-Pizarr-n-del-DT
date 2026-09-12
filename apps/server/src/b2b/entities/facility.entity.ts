import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { B2bRecordStatus } from './b2b.enums';

@Entity('b2b_facilities')
@Index(['organizationId', 'name'], { unique: true })
export class B2bFacilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 220, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 20, default: B2bRecordStatus.ACTIVE })
  status!: B2bRecordStatus;
}