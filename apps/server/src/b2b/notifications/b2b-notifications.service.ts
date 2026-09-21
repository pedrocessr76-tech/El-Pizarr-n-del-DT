import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  B2bNotificationPayload,
  NotificationPayload,
  NotificationType,
  Severity,
} from '../../../../../packages/shared/types/models';
import { B2bNotificationEntity } from './b2b-notification.entity';
import { B2bNotificationsGateway } from './b2b-notifications.gateway';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bRoleCode } from '../entities/b2b.enums';
import { B2bJwtUser } from '../auth/b2b-auth.types';

/** Roles que constituyen el staff de un complejo. */
const STAFF_ROLES = [B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR];

export interface B2bNotifyOptions {
  type: NotificationType;
  severity: Severity;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface B2bNotifyResult {
  payloads: B2bNotificationPayload[];
  saved: B2bNotificationEntity[];
}

/**
 * Notificaciones persistentes + websocket para Sistema Canchas (B2B).
 *
 * El fan-out de un aviso general del complejo crea UNA fila por integrante de
 * la organización (staff incluido, el actor inclusive, y los clientes), para
 * que "marcar como leída" siga siendo por usuario y la bandeja del staff
 * persista el anuncio con su propio id. En el push en vivo:
 *  - el staff (incl. el actor) recibe su copia con id por su canal personal;
 *  - los clientes reciben el payload BASE (sin id) por el canal de la org y
 *    deduplican por contenido contra su copia persistida.
 */
@Injectable()
export class B2bNotificationsService {
  constructor(
    @InjectRepository(B2bNotificationEntity, 'b2b') private readonly notifications: Repository<B2bNotificationEntity>,
    @InjectRepository(B2bUserRoleEntity, 'b2b') private readonly userRoles: Repository<B2bUserRoleEntity>,
    @InjectRepository(B2bUserEntity, 'b2b') private readonly users: Repository<B2bUserEntity>,
    private readonly gateway: B2bNotificationsGateway,
  ) {}

  /**
   * Notifica al staff de la organización (fila por integrante + push id'd solo
   * a staff). Si se pasa actorUserId, ese integrante queda excluido del fan-out
   * (el actor nunca recibe su propia notificación en flujos puntuales).
   */
  async notifyStaff(
    organizationId: string,
    opts: B2bNotifyOptions,
    actorUserId?: string,
  ): Promise<B2bNotifyResult> {
    const staffUserIds = await this.getStaffUserIds(organizationId);
    const recipients = actorUserId ? staffUserIds.filter((id) => id !== actorUserId) : staffUserIds;
    return this.deliver(organizationId, recipients, opts, true);
  }

  /** Notifica a un usuario puntual (fila + push id'd personal). */
  async notifyUser(
    userId: string,
    organizationId: string,
    opts: B2bNotifyOptions,
    actorUserId?: string,
  ): Promise<B2bNotifyResult> {
    if (actorUserId && actorUserId === userId) {
      return { payloads: [], saved: [] };
    }
    return this.deliver(organizationId, [userId], opts, true);
  }

  /**
   * Aviso general de la organización (staff publishing only): fila por CADA
   * integrante excepto el actor (staff y clientes, para que bandeja/read sean
   * por usuario), push id'd SOLO al staff y base sin id por el canal de org
   * para los clientes (dedupe por contenido).
   */
  async broadcastToOrganization(
    organizationId: string,
    opts: B2bNotifyOptions,
    actorUserId?: string,
  ): Promise<B2bNotifyResult> {
    const assignments = await this.userRoles.find({ where: { organizationId } });
    const userSet = Array.from(new Set(assignments.map((assignment) => assignment.userId)));
    const recipients = actorUserId ? userSet.filter((userId) => userId !== actorUserId) : userSet;
    return this.deliver(organizationId, recipients, opts, false);
  }

  /** Ids de los integrantes staff (OWNER/ADMIN/OPERATOR) de una organización. */
  async getStaffUserIds(organizationId: string): Promise<string[]> {
    const assignments = await this.userRoles.find({
      where: { organizationId, roleId: In(STAFF_ROLES) },
    });
    return Array.from(new Set(assignments.map((assignment) => assignment.userId)));
  }

  /** Bandeja del usuario actual (persistida) + recuento de no leídos. */
  async listForUser(user: B2bJwtUser, limit = 100) {
    const [items, unreadCount] = await Promise.all([
      this.notifications.find({
        where: { recipientUserId: user.userId },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.notifications.count({
        where: { recipientUserId: user.userId, read: false },
      }),
    ]);
    return { items, unreadCount };
  }

  /** Marca una notificación propia como leída. */
  async markRead(user: B2bJwtUser, id: string): Promise<{ updated: boolean }> {
    const result = await this.notifications.update(
      { id, recipientUserId: user.userId },
      { read: true },
    );
    return { updated: (result.affected ?? 0) > 0 };
  }

  /** Marca todas las notificaciones del usuario como leídas. */
  async markAllRead(user: B2bJwtUser): Promise<{ updated: number }> {
    const result = await this.notifications.update(
      { recipientUserId: user.userId, read: false },
      { read: true },
    );
    return { updated: result.affected ?? 0 };
  }

  /** Nombre visible del usuario (staff) para el metadata del aviso. */
  async getUserDisplayName(userId: string): Promise<string> {
    const user = await this.users.findOneBy({ id: userId });
    return user?.fullName?.trim() || user?.email || 'Cliente';
  }

  // ------------------------------------------------------------------
  // Privados
  // ------------------------------------------------------------------

  /**
   * Crea las filas y las entrega. Con `personalPush = true` cada destinatario
   * recibe el payload id'd por su canal personal (staff en `notifyStaff`,
   * cliente en `notifyUser`); con `false` (anuncios por `broadcastToOrganization`)
   * sólo el staff recibe su copia id'd y los clientes deduplican el payload base
   * del canal de la org. En cualquier caso el payload base sin id se emite al
   * canal de la org.
   */
  private async deliver(
    organizationId: string,
    recipientUserIds: string[],
    opts: B2bNotifyOptions,
    personalPush: boolean,
  ): Promise<B2bNotifyResult> {
    if (recipientUserIds.length === 0) {
      return { payloads: [], saved: [] };
    }
    const rows = this.notifications.create(
      recipientUserIds.map((recipientUserId) => ({
        organizationId,
        recipientUserId,
        type: opts.type,
        severity: opts.severity,
        title: opts.title,
        body: opts.body,
        metadata: opts.metadata ?? {},
      })),
    );
    const saved = await this.notifications.save(rows);
    const payloads = saved.map((row) => this.toRowPayload(opts, row));
    if (!personalPush) {
      const staffUserIds = await this.getStaffUserIds(organizationId);
      for (let i = 0; i < payloads.length; i++) {
        if (staffUserIds.includes(saved[i].recipientUserId)) {
          this.gateway.emitToUser(saved[i].recipientUserId, payloads[i]);
        }
      }
    } else {
      for (let i = 0; i < payloads.length; i++) {
        this.gateway.emitToUser(saved[i].recipientUserId, payloads[i]);
      }
    }
    this.gateway.emitToOrganization(organizationId, this.toBasePayload(opts));
    return { payloads, saved };
  }

  private toRowPayload(opts: B2bNotifyOptions, row: B2bNotificationEntity): B2bNotificationPayload {
    return {
      id: row.id,
      type: opts.type,
      severity: opts.severity,
      title: opts.title,
      body: opts.body,
      timestamp: Date.now(),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? new Date().toISOString()),
      read: row.read,
      metadata: opts.metadata ?? {},
    };
  }

  private toBasePayload(opts: B2bNotifyOptions): NotificationPayload {
    return {
      type: opts.type,
      severity: opts.severity,
      title: opts.title,
      body: opts.body,
      timestamp: Date.now(),
      metadata: opts.metadata ?? {},
    };
  }
}