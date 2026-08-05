import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tournaments')
export class TournamentEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  userTeamId!: string;

  @Column({ length: 20, default: 'IN_PROGRESS' })
  status!: string;

  @Column({ length: 20, default: 'OCTAVOS' })
  currentRound!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
