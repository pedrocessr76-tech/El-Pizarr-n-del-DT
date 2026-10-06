import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('b2b_pivot_messages')
@Index(['requestId', 'createdAt'])
export class B2bPivotMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  requestId!: string;

  @Column({ type: 'uuid' })
  senderUserId!: string;

  @Column({ type: 'varchar', length: 1000 })
  body!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}