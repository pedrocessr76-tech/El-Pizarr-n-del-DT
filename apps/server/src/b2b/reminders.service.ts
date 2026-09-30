import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { inValues, RepositoryPort, getRepositoryPortToken } from '../persistence/repository.port';
import { B2bBookingEntity } from './entities/booking.entity';
import { B2bBookingReminderEntity } from './entities/booking-reminder.entity';
import { BookingStatus } from './entities/b2b.enums';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bUserEntity } from './entities/user.entity';
import { canSendWhatsApp } from './domain-policy';
import { B2bJwtUser } from './auth/b2b-auth.types';
import { B2bRoleCode } from './entities/b2b.enums';
import { orgDateString, orgTimeString, resolveTimeZone } from './time';

const STAFF_ROLES = new Set<string>([
  B2bRoleCode.OWNER,
  B2bRoleCode.ADMIN,
  B2bRoleCode.OPERATOR,
]);

export interface PendingWhatsAppAlert {
  reminderId: string;
  bookingId: string;
  clientName: string;
  phone: string;
  courtName: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  minutesBefore: number;
  body: string;
}

/**
 * Avisos de WhatsApp que el processor dejó pendientes de despacho manual (#34).
 *
 * El servidor no envía WhatsApp: arma el mensaje y lo expone para que el staff
 * lo despache desde el dashboard con un deep link `wa.me`. Así no hace falta un
 * proveedor pago ni una sesión no oficial susceptible de baneo.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @Inject(getRepositoryPortToken(B2bBookingReminderEntity, 'b2b')) private readonly reminders: RepositoryPort<B2bBookingReminderEntity>,
    @Inject(getRepositoryPortToken(B2bBookingEntity, 'b2b')) private readonly bookings: RepositoryPort<B2bBookingEntity>,
    @Inject(getRepositoryPortToken(B2bShiftEntity, 'b2b')) private readonly shifts: RepositoryPort<B2bShiftEntity>,
    @Inject(getRepositoryPortToken(B2bCourtEntity, 'b2b')) private readonly courts: RepositoryPort<B2bCourtEntity>,
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    @Inject(getRepositoryPortToken(B2bOrganizationEntity, 'b2b')) private readonly organizations: RepositoryPort<B2bOrganizationEntity>,
  ) {}

  async listPending(user: B2bJwtUser, now = new Date()): Promise<PendingWhatsAppAlert[]> {
    this.assertStaff(user);

    const waiting = await this.reminders.find({ where: { channel: 'whatsapp', status: 'AWAITING_MANUAL' } });
    if (waiting.length === 0) return [];

    const bookings = await this.bookings.find({
      where: { id: inValues([...new Set(waiting.map((reminder) => reminder.bookingId))]) },
    });
    const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
    const active = bookings.filter(
      (booking) => booking.organizationId === user.organizationId &&
        (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED),
    );
    if (active.length === 0) return [];

    const shifts = await this.shifts.find({ where: { id: inValues([...new Set(active.map((booking) => booking.shiftId))]) } });
    const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));

    // El turno ya empezó: el aviso dejó de servir y no se ofrece.
    const withFutureShift = active.filter((booking) => (shiftById.get(booking.shiftId)?.startsAt ?? now) > now);
    if (withFutureShift.length === 0) return [];

    const [clients, courts, organization] = await Promise.all([
      this.users.find({ where: { id: inValues([...new Set(withFutureShift.map((booking) => booking.clientUserId))]) } }),
      this.courts.find({ where: { id: inValues([...new Set(withFutureShift.map((booking) => booking.courtId))]) } }),
      this.organizations.findOneBy({ id: user.organizationId }),
    ]);
    const clientById = new Map(clients.map((client) => [client.id, client]));
    const courtById = new Map(courts.map((court) => [court.id, court]));
    const timezone = resolveTimeZone(organization?.timezone);

    const alerts: PendingWhatsAppAlert[] = [];
    for (const reminder of waiting) {
      const booking = bookingById.get(reminder.bookingId);
      const shift = booking ? shiftById.get(booking.shiftId) : undefined;
      if (!booking || !shift) continue;
      const client = clientById.get(booking.clientUserId);
      if (!client || !canSendWhatsApp(client.whatsappPhone, client.whatsappOptIn)) continue;

      const courtName = courtById.get(booking.courtId)?.name ?? 'la cancha';
      const when = `${orgDateString(shift.startsAt, timezone)} a las ${orgTimeString(shift.startsAt, timezone)}`;
      alerts.push({
        reminderId: reminder.id,
        bookingId: booking.id,
        clientName: client.fullName || client.email,
        phone: client.whatsappPhone as string,
        courtName,
        startsAt: shift.startsAt.toISOString(),
        dateLabel: orgDateString(shift.startsAt, timezone),
        timeLabel: orgTimeString(shift.startsAt, timezone),
        minutesBefore: reminder.minutesBefore,
        body: `Hola ${client.fullName || client.email}, te recordamos tu turno en ${courtName} el ${when}.`,
      });
    }

    return alerts.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  /**
   * El staff confirma que despachó el aviso. Es una confirmación best-effort: el
   * envío ocurre en su teléfono, así que el servidor no puede verificarlo y no
   * pretende hacerlo. Lo que evita es que el panel lo vuelva a ofrecer.
   */
  async markDispatched(user: B2bJwtUser, reminderId: string) {
    this.assertStaff(user);

    const reminder = await this.reminders.findOneBy({ id: reminderId });
    if (!reminder) throw new NotFoundException('Aviso no encontrado.');

    const booking = await this.bookings.findOneBy({ id: reminder.bookingId });
    if (!booking || booking.organizationId !== user.organizationId) {
      throw new NotFoundException('Aviso no encontrado.');
    }
    if (reminder.channel !== 'whatsapp' || reminder.status !== 'AWAITING_MANUAL') {
      throw new NotFoundException('El aviso ya no está pendiente de despacho.');
    }

    await this.reminders.update({ id: reminder.id }, { status: 'SENT', provider: 'manual', processedAt: new Date() });
    this.logger.log(`Aviso de WhatsApp despachado manualmente (reserva ${booking.id}, ${reminder.minutesBefore} min).`);
    return { dispatched: true };
  }

  private assertStaff(user: B2bJwtUser): void {
    if (!user.roles?.some((role) => STAFF_ROLES.has(role))) {
      throw new ForbiddenException('Solo el personal del complejo puede ver los avisos pendientes.');
    }
  }
}
