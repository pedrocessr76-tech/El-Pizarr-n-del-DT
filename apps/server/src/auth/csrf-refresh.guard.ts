import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { isOriginAllowed } from '../config/cors';

/**
 * Protección CSRF para los únicos endpoints que se autentican con cookie
 * (refresh y logout, issue #17).
 *
 * La cookie ya es SameSite=Lax: un POST cross-site (formulario/JSON de otro
 * sitio) no la envía. Como defensa en profundidad, si llega el header Origin
 * exigimos que esté en la allowlist de CORS. Sin Origin (petición misma-origen
 * o cliente no-navegador como curl/tests) se permite.
 */
@Injectable()
export class CsrfRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return isOriginAllowed(request.headers.origin);
  }
}