import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tournaments')
export class TournamentEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  // Sesión de invitado efímera (se borra con la sesión).
  @Column({ type: 'text', nullable: true })
  sessionId?: string | null;

  @Column()
  userTeamId!: string;

  @Column({ length: 20, default: 'IN_PROGRESS' })
  status!: string;

  @Column({ length: 20, default: 'OCTAVOS' })
  currentRound!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
