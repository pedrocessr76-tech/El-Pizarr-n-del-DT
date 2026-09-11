import { Column, Entity, PrimaryColumn } from 'typeorm';
import { B2bRoleCode } from './b2b.enums';

@Entity('b2b_roles')
export class B2bRoleEntity {
  @PrimaryColumn({ length: 20 })
  id!: B2bRoleCode;

  @Column({ length: 80 })
  name!: string;
}