import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('team_players')
export class TeamPlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  teamId!: string;

  @Column()
  playerId!: string;

  @Column({ default: false })
  isStarter!: boolean;

  @Column({ type: 'int', default: 0 })
  slotIndex!: number;
}
