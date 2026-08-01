import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('teams')
export class TeamEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ nullable: true })
  userId?: string;
}
