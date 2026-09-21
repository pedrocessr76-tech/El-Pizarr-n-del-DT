import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import type { NotificationPayload } from '../../../../../packages/shared/types/models';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { B2bRoleCode } from '../entities/b2b.enums';

const B2B_JWT_SECRET = process.env.B2B_JWT_SECRET || 'sistema-canchas-secret';

/** Canales B2B (prefijados para no colisionar con los del juego). */
export const b2bOrgChannel = (organizationId: string) => `b2b:org:${organizationId}`;
export const b2bUserChannel = (userId: string) => `b2b:user:${userId}`;

const isStaffRole = (role: string): boolean =>
  [B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR].includes(role as B2bRoleCode);

/**
 * Gateway de notificaciones WebSocket para Sistema Canchas (B2B).
 *
 * Handshake: `auth.token` = JWT de Sistema Canchas (`B2B_JWT_SECRET`) con
 * payload `{ userId, organizationId, email, roles }`.
 *
 * - Staff (OWNER/ADMIN/OPERATOR): se suscribe al canal de su organización
 *   (`b2b:org:<organizationId>`) y a su canal personal (`b2b:user:<userId>`).
 * - Cliente (CLIENT): se suscribe solo a su canal personal.
 *
 * Convive en el mismo servidor socket.io que el gateway del juego; los canales
 * `b2b:*` están prefijados para no colisionar con `notification:*`.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*', credentials: true }, path: '/socket.io' })
export class B2bNotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(B2bNotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  private readonly online = new Map<string, { userId: string; organizationId: string }>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      this.logger.warn(`B2B WS ${client.id}: sin token, rechazado.`);
      client.disconnect();
      return;
    }

    let user: B2bJwtUser;
    try {
      user = await this.jwtService.verifyAsync<B2bJwtUser>(token, {
        secret: B2B_JWT_SECRET,
      });
      if (!user?.userId || !user?.organizationId || !Array.isArray(user.roles)) {
        throw new Error('payload B2B incompleto');
      }
    } catch {
      this.logger.warn(`B2B WS ${client.id}: token JWT inválido, rechazado.`);
      client.disconnect();
      return;
    }

    await client.join(b2bUserChannel(user.userId));
    // Todo miembro (staff o cliente) ingresa además al canal de la organización:
    // por ahí llega la copia base sin id (dedupe por contenido en el cliente) y
    // el staff recibe su copia id'd por su canal personal.
    await client.join(b2bOrgChannel(user.organizationId));

    this.online.set(client.id, { userId: user.userId, organizationId: user.organizationId });
    this.logger.log(
      `B2B WS conectado → ${b2bUserChannel(user.userId)}${user.roles.some(isStaffRole) ? `, ${b2bOrgChannel(user.organizationId)}` : ''} (${client.id})`,
    );
  }

  handleDisconnect(client: Socket): void {
    this.online.delete(client.id);
  }

  emitToOrganization(organizationId: string, payload: NotificationPayload): void {
    this.server?.to(b2bOrgChannel(organizationId)).emit('notification', payload);
  }

  emitToUser(userId: string, payload: NotificationPayload): void {
    this.server?.to(b2bUserChannel(userId)).emit('notification', payload);
  }
}