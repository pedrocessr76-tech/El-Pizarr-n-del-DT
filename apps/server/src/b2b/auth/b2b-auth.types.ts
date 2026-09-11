import { B2bRoleCode } from '../entities/b2b.enums';

export interface B2bJwtUser {
  userId: string;
  organizationId: string;
  email: string;
  roles: B2bRoleCode[];
}