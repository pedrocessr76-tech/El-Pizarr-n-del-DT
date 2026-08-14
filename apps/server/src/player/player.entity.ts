import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('players')
export class PlayerEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  nationality!: string;

  @Column({ length: 3 })
  position!: string;

  @Column({ type: 'int', default: 50 })
  rating!: number;

  @Column({ type: 'int', default: 50 })
  pace!: number;

  @Column({ type: 'int', default: 50 })
  shooting!: number;

  @Column({ type: 'int', default: 50 })
  passing!: number;

  @Column({ type: 'int', default: 50 })
  dribbling!: number;

  @Column({ type: 'int', default: 50 })
  defending!: number;

  @Column({ type: 'int', default: 50 })
  physical!: number;
}
