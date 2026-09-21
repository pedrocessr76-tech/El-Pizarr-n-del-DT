import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { requireB2bJwtSecret } from '../../config/env';
import { wsOriginCheck } from '../../config/cors';
import type { NotificationPayload } from '../../../../../packages/shared/types/models';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { B2bAuthService } from '../auth/b2b-auth.service';
import { B2bRoleCode } from '../entities/b2b.enums';

const B2B_JWT_SECRET = requireB2bJwtSecret();

/** Canales B2B (prefijados para no colisionar con los del juego). */
export const b2bOrgChannel = (organizationId: string) => `b2b:org:${organizationId}`;
export const b2bUserChannel = (userId: string) => `b2b:user:${userId}`;

const isStaffRole = (role: string): boolean =>
  [B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR].includes(role as B2bRoleCode);

/**
 * Gateway de notificaciones WebSocket para Sistema Canchas (B2B).
 *
 * Handshake: `auth.token` = JWT de Sistema Canchas (`B2B_JWT_SECRET`). La
 * identidad (roles y status) se REVALIDA contra la BD vía B2bAuthService en cada
 * conexión, por lo que un usuario desactivado o degradado queda aislado de
 * inmediato.
 *
 * Suscripciones:
 *  - Staff (OWNER/ADMIN/OPERATOR): canal de su organización (`b2b:org:<org>`)
 *    + canal personal (`b2b:user:<userId>`).
 *  - Cliente (CLIENT): SOLO su canal personal. Nunca entra al canal de la org:
 *    así no recibe reservas/eventos de terceros (aislamiento por identidad).
 *
 * Convive con el gateway del juego en el MISMO servidor socket.io pero en un
 * NAMESPACE propio (`/b2b`): así cada conexión solo la ve y valida su gateway.
 * Sin namespace, el handleConnection del juego vería las conexiones B2B y las
 * cortaría (un token B2B no pasa el secreto JWT del juego), y viceversa. Los
 * canales `b2b:*` siguen prefijados para no colisionar con `notification:*`.
 */
@Injectable()
@WebSocketGateway({ namespace: '/b2b', cors: { origin: wsOriginCheck, credentials: true }, path: '/socket.io' })
export class B2bNotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(B2bNotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  private readonly online = new Map<string, { userId: string; organizationId: string }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: B2bAuthService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      this.logger.warn(`B2B WS ${client.id}: sin token, rechazado.`);
      client.disconnect();
      return;
    }

    let claims: B2bJwtUser;
    try {
      claims = await this.jwtService.verifyAsync<B2bJwtUser>(token, {
        secret: B2B_JWT_SECRET,
      });
    } catch {
      this.logger.warn(`B2B WS ${client.id}: token JWT inválido, rechazado.`);
      client.disconnect();
      return;
    }

    // Revalidación contra la BD: roles/status frescos, token revocado de inmediato.
    let user: B2bJwtUser;
    try {
      user = await this.authService.resolveUserFromToken(claims);
    } catch {
      this.logger.warn(`B2B WS ${client.id}: sesión ya no es válida, rechazado.`);
      client.disconnect();
      return;
    }

    const isStaff = user.roles.some(isStaffRole);
    await client.join(b2bUserChannel(user.userId));
    if (isStaff) {
      await client.join(b2bOrgChannel(user.organizationId));
    }

    this.online.set(client.id, { userId: user.userId, organizationId: user.organizationId });
    this.logger.log(
      `B2B WS conectado → ${b2bUserChannel(user.userId)}${isStaff ? `, ${b2bOrgChannel(user.organizationId)}` : ''} (${client.id})`,
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