import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { isOriginAllowed } from '../config/cors';

/**
 * Protección CSRF para los únicos endpoints que se autentican con cookie
 * (refresh y logout, issue #17).
 *
 * En producción la cookie es SameSite=None (necesario para requests
 * cross-origin entre el frontend y la API en Render). Por eso la defensa
 * CSRF descansa aquí: si llega el header Origin exigimos que esté en la
 * allowlist de CORS (variable CORS_ORIGIN). Sin Origin (petición misma-origen
 * o cliente no-navegador como curl/tests) se permite.
 *
 * IMPORTANTE: configurar CORS_ORIGIN en las variables de entorno de Render
 * con la URL del frontend (ej: https://el-pizarron.onrender.com).
 */
@Injectable()
export class CsrfRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return isOriginAllowed(request.headers.origin);
  }
}