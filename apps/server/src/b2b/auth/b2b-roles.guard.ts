import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { B2B_ROLES_KEY } from './b2b-auth.decorators';
import { B2bJwtUser } from './b2b-auth.types';

@Injectable()
export class B2bRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(B2B_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const user = context.switchToHttp().getRequest().user as B2bJwtUser;
    return requiredRoles.some((role) => user.roles.includes(role as never));
  }
}