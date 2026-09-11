import { Column, Entity, PrimaryColumn } from 'typeorm';
import { B2bRoleCode } from './b2b.enums';

@Entity('b2b_user_roles')
export class B2bUserRoleEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ type: 'uuid' })
  organizationId!: string;

  @PrimaryColumn({ length: 20 })
  roleId!: B2bRoleCode;
}