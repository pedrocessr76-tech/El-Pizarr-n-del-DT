import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  username!: string;

  @Column()
  password!: string;

  /** Perfil opt-in de jugador pivote asociado a la cuenta del juego. */
  @Column({ type: 'boolean', default: false })
  pivotAvailable!: boolean;

  /** GOALKEEPER, FIELD o BOTH; las posiciones favoritas se guardan aparte. */
  @Column({ type: 'varchar', length: 16, default: 'FIELD' })
  pivotRole!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  pivotPositions!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}

