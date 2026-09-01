import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('matches')
export class MatchEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ length: 50, nullable: true })
  tournamentId!: string;

  @Column({ length: 20, default: 'OCTAVOS' })
  round!: string;

  @Column({ nullable: true })
  userId?: string;

  // Sesión de invitado efímera (se borra con la sesión).
  @Column({ type: 'text', nullable: true })
  sessionId?: string | null;

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

  // Resumen por jugador (calificaciones, goles, asistencias) serializado en JSON.
  @Column({ type: 'text', nullable: true })
  summaryJson?: string | null;
}
