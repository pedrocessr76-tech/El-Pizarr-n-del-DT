import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import type {
  NotificationPayload,
  NotificationType,
  Severity,
} from '../../../../packages/shared/types/models';

export interface NotifyOptions {
  type: NotificationType;
  severity: Severity;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

/**
 * Servicio de notificaciones en tiempo real. Envuelve el gateway para emitir
 * payloads tipados al canal de un usuario o de una sesión invitada.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  private build({ type, severity, title, body, metadata }: NotifyOptions): NotificationPayload {
    return { type, severity, title, body, metadata, timestamp: Date.now() };
  }

  /** Emite a un usuario autenticado. */
  notifyUser(userId: string, opts: NotifyOptions): void {
    if (!userId) return;
    this.gateway.emitToUser(userId, this.build(opts));
  }

  /** Emite a una sesión de invitado. */
  notifySession(sessionId: string, opts: NotifyOptions): void {
    if (!sessionId) return;
    this.gateway.emitToSession(sessionId, this.build(opts));
  }

  /** Emite al receptor que corresponda según qué se tenga disponible. */
  notify(userId: string | null | undefined, sessionId: string | null | undefined, opts: NotifyOptions): void {
    if (userId) this.notifyUser(userId, opts);
    else if (sessionId) this.notifySession(sessionId, opts);
  }
}