import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('teams')
export class TeamEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ nullable: true })
  userId?: string;

  // Identifica los equipos de sesiones de invitado (efímeros). Se limpian al cerrar sesión.
  @Column({ type: 'text', nullable: true })
  sessionId?: string | null;

  // Los equipos reales de LaLiga/Premier/extra (seed) son equipos IA oponentes.
  // Los equipos creados por el usuario NO lo son.
  @Column({ type: 'boolean', default: false })
  isReal!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
