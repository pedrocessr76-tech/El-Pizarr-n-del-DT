import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import type { NotificationPayload } from '../../../../packages/shared/types/models';

const JWT_SECRET = process.env.JWT_SECRET || 'el-pizarron-dt-secret-key';

/** Canal sobre el cual recibe notificaciones un receptor (usuario o sesión invitado). */
const channelOf = (userId?: string, sessionId?: string): string | null =>
  userId ? `notification:${userId}` : sessionId ? `notification:${sessionId}` : null;

/**
 * Gateway de notificaciones WebSocket (socket.io).
 *
 * Handshake:
 *  - Usuario logueado: `auth.token` = JWT de la app (`{ sub, username }`).
 *  - Invitado: `query.sessionId` = id de sesión invitado generado en el cliente.
 *
 * Cada conexión se suscribe a su canal `notification:<userId|sessionId>` y recibe
 * el evento `'notification'`. Al desconectarse se limpia la suscripción (huérfanas).
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*', credentials: true }, path: '/socket.io' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  private readonly online = new Map<string, { userId?: string; sessionId?: string }>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    // 1) JWT del usuario (si hay).
    const token = client.handshake.auth?.token;
    let userId: string | undefined;
    if (token && typeof token === 'string') {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token, {
          secret: JWT_SECRET,
        });
        if (!payload?.sub) throw new Error('sin sub');
        userId = payload.sub;
      } catch {
        this.logger.warn(`WS ${client.id}: token JWT inválido, rechazado.`);
        client.disconnect();
        return;
      }
    }

    // 2) Sesión de invitado (si hay y no hay usuario).
    let sessionId: string | undefined;
    if (!userId) {
      const query = client.handshake.query ?? {};
      const sid = Array.isArray(query.sessionId) ? query.sessionId[0] : query.sessionId;
      if (sid && typeof sid === 'string' && sid.trim()) {
        sessionId = sid.trim();
      }
    }

    // 3) Canal objetivo. Sin identidad → se corta la conexión.
    const channel = channelOf(userId, sessionId);
    if (!channel) {
      client.disconnect();
      return;
    }

    await client.join(channel);
    this.online.set(client.id, { userId, sessionId });
    this.logger.log(`WS conectado → ${channel} (${client.id})`);
  }

  handleDisconnect(client: Socket): void {
    this.online.delete(client.id);
  }

  /** Número de canales con conexiones activas (para depuración). */
  get activeChannels(): number {
    return new Set(Array.from(this.online.values()).map((e) => channelOf(e.userId, e.sessionId))).size;
  }

  emitToChannel(channel: string, payload: NotificationPayload): void {
    this.server?.to(channel).emit('notification', payload);
  }

  emitToUser(userId: string, payload: NotificationPayload): void {
    this.emitToChannel(`notification:${userId}`, payload);
  }

  emitToSession(sessionId: string, payload: NotificationPayload): void {
    this.emitToChannel(`notification:${sessionId}`, payload);
  }
}