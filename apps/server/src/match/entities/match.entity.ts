import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('matches')
export class MatchEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 50, nullable: true })
  tournamentId!: string;

  @Column({ length: 20, default: 'OCTAVOS' })
  round!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  homeTeamId!: string;

  @Column()
  awayTeamId!: string;

  @Column({ type: 'int', default: 0 })
  homeScore!: number;

  @Column({ type: 'int', default: 0 })
  awayScore!: number;

  @Column({ length: 20, default: 'PENDING' })
  status!: string;

  @Column({ nullable: true })
  winnerId?: string;
}
