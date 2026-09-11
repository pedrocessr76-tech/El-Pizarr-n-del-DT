import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { B2bJwtUser } from './b2b-auth.types';

export const B2B_ROLES_KEY = 'b2b_roles';
export const B2bRoles = (...roles: string[]) => SetMetadata(B2B_ROLES_KEY, roles);

export const CurrentB2bUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): B2bJwtUser =>
    context.switchToHttp().getRequest().user,
);