import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { betweenValues, inValues, RepositoryPort, UnitOfWork, getRepositoryPortToken } from '../persistence/repository.port';
import { B2B_UNIT_OF_WORK } from '../persistence/persistence.module';
import { B2bBookingEntity } from './entities/booking.entity';
import { B2bBookingReminderEntity, ReminderChannel } from './entities/booking-reminder.entity';
import { BookingStatus } from './entities/b2b.enums';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bUserEntity } from './entities/user.entity';
import { canSendWhatsApp } from './domain-policy';
import { renderBookingReminderEmail } from './booking-reminder.template';
import { MessagingService } from './messaging/messaging.service';
import { orgDateString, orgTimeString, resolveTimeZone } from './time';

const DEFAULT_EMAIL_INTERVALS = [1440];
const DEFAULT_WHATSAPP_INTERVALS = [30];
const MAX_INTERVAL_MINUTES = 7 * 24 * 60;
const POLL_INTERVAL_MS = 60_000;
const PROCESSING_LEASE_MS = 10 * 60_000;

/**
 * Estados que ya no se reintentan: terminales para el ciclo.
 *
 * `FAILED` NO es terminal a propósito: el spec exige que un envío fallido
 * vuelva a ser elegible, así que el siguiente ciclo lo reclama otra vez.
 */
const TERMINAL_STATUSES: B2bBookingReminderEntity['status'][] = ['SENT', 'SIMULATED', 'SKIPPED'];

export function reminderIntervalsFor(
  organization: Pick<B2bOrganizationEntity, 'emailReminderIntervalsMinutes' | 'whatsappReminderIntervalsMinutes'>,
  channel: ReminderChannel,
): number[] {
  const configured = channel === 'email'
    ? organization.emailReminderIntervalsMinutes
    : organization.whatsappReminderIntervalsMinutes;
  const fallback = channel === 'email' ? DEFAULT_EMAIL_INTERVALS : DEFAULT_WHATSAPP_INTERVALS;
  if (!Array.isArray(configured)) return fallback;
  const valid = configured.filter((value) => Number.isInteger(value) && value > 0 && value <= MAX_INTERVAL_MINUTES);
  return valid;
}

/**
 * Procesa los recordatorios vencidos de las reservas activas (#34).
 *
 * Bifurca por canal según el criterio de tiempo de reacción del cliente:
 * - `email`: el servidor lo envía solo, aunque el dashboard esté cerrado.
 * - `whatsapp`: no se envía. El aviso queda `AWAITING_MANUAL` y el staff lo
 *   despacha desde el dashboard con un deep link. Enviar WhatsApp desde el
 *   servidor exigiría un proveedor pago o una sesión no oficial con riesgo de
 *   baneo, y a esta anticipación el autoenvío no aporta nada (#34).
 */
@Injectable()
export class BookingRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingRemindersService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    @Inject(getRepositoryPortToken(B2bOrganizationEntity, 'b2b')) private readonly organizations: RepositoryPort<B2bOrganizationEntity>,
    @Inject(getRepositoryPortToken(B2bBookingEntity, 'b2b')) private readonly bookings: RepositoryPort<B2bBookingEntity>,
    @Inject(getRepositoryPortToken(B2bShiftEntity, 'b2b')) private readonly shifts: RepositoryPort<B2bShiftEntity>,
    @Inject(getRepositoryPortToken(B2bCourtEntity, 'b2b')) private readonly courts: RepositoryPort<B2bCourtEntity>,
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    @Inject(getRepositoryPortToken(B2bBookingReminderEntity, 'b2b')) private readonly reminders: RepositoryPort<B2bBookingReminderEntity>,
    @Inject(B2B_UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly messaging: MessagingService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.processDueReminders(), POLL_INTERVAL_MS);
    this.timer.unref?.();
    void this.processDueReminders();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async processDueReminders(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const organizations = await this.organizations.find();
      if (organizations.length === 0) return;
      const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
      const activeBookings = await this.bookings.find({
        where: { status: inValues([BookingStatus.PENDING, BookingStatus.CONFIRMED]) },
      });
      if (activeBookings.length === 0) return;

      const from = now;
      const to = new Date(now.getTime() + this.maxIntervalMinutes(organizations) * 60_000);
      const shifts = await this.shifts.find({
        where: { id: inValues([...new Set(activeBookings.map((booking) => booking.shiftId))]), startsAt: betweenValues(from, to) },
      });
      const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
      const dueBookings = activeBookings.filter((booking) => shiftById.has(booking.shiftId));
      if (dueBookings.length === 0) return;

      const [users, courts] = await Promise.all([
        this.users.find({ where: { id: inValues([...new Set(dueBookings.map((booking) => booking.clientUserId))]) } }),
        this.courts.find({ where: { id: inValues([...new Set(dueBookings.map((booking) => booking.courtId))]) } }),
      ]);
      const userById = new Map(users.map((user) => [user.id, user]));
      const courtById = new Map(courts.map((court) => [court.id, court]));

      for (const booking of dueBookings) {
        const organization = organizationById.get(booking.organizationId);
        const shift = shiftById.get(booking.shiftId);
        if (!organization || !shift || shift.startsAt <= now) continue;
        const client = userById.get(booking.clientUserId);
        const courtName = courtById.get(booking.courtId)?.name ?? 'la cancha';
        const timezone = resolveTimeZone(organization.timezone);
        const when = `${orgDateString(shift.startsAt, timezone)} a las ${orgTimeString(shift.startsAt, timezone)}`;

        for (const channel of ['email', 'whatsapp'] as ReminderChannel[]) {
          for (const minutesBefore of reminderIntervalsFor(organization, channel)) {
            if (shift.startsAt.getTime() - minutesBefore * 60_000 > now.getTime()) continue;
            await this.handleDueReminder({ booking, channel, minutesBefore, shift, client, courtName, when });
          }
        }
      }
    } catch (error) {
      this.logger.error(`No se pudieron procesar los recordatorios: ${(error as Error)?.message ?? error}`);
    } finally {
      this.running = false;
    }
  }

  private async handleDueReminder(context: {
    booking: B2bBookingEntity;
    channel: ReminderChannel;
    minutesBefore: number;
    shift: B2bShiftEntity;
    client: B2bUserEntity | undefined;
    courtName: string;
    when: string;
  }) {
    const { booking, channel, minutesBefore, client, courtName, when } = context;
    const reminder = await this.claimReminder(booking.id, channel, minutesBefore, new Date());
    if (!reminder) return;

    if (channel === 'whatsapp') {
      // Sin teléfono o sin consentimiento no hay a quién avisar: no se lista.
      if (!client || !canSendWhatsApp(client.whatsappPhone, client.whatsappOptIn)) {
        await this.finishReminder(reminder.id, 'SKIPPED', null, 'Cliente sin teléfono o consentimiento WhatsApp.');
        this.logger.log(`Aviso omitido para la reserva ${booking.id}: falta teléfono o consentimiento WhatsApp.`);
        return;
      }
      await this.finishReminder(reminder.id, 'AWAITING_MANUAL', null, null);
      return;
    }

    // Email: comunicación transaccional sobre una reserva que el cliente hizo,
    // así que no exige una marca de consentimiento adicional (#34).
    if (!client?.email) {
      await this.finishReminder(reminder.id, 'SKIPPED', null, 'El cliente no tiene email registrado.');
      this.logger.log(`Recordatorio de email omitido para la reserva ${booking.id}: el cliente no tiene email.`);
      return;
    }

    const clientName = client.fullName || client.email;
    const mail = renderBookingReminderEmail({ clientName, courtName, when, minutesBefore });
    try {
      const result = await this.messaging.sendEmail(
        client.email,
        { text: mail.text, html: mail.html },
        mail.subject,
        'reminder',
        { bookingId: booking.id, minutesBefore },
      );
      if (!result.delivered) {
        await this.finishReminder(reminder.id, 'FAILED', result.provider, 'El proveedor no confirmó la entrega.');
        return;
      }
      const status = result.provider === 'log' ? 'SIMULATED' : 'SENT';
      await this.finishReminder(reminder.id, status, result.provider, null);
      if (status === 'SIMULATED') {
        this.logger.warn(`Recordatorio de email simulado; no se entregó (reserva ${booking.id}, ${minutesBefore} min).`);
      }
    } catch (error) {
      const reason = (error as Error)?.message ?? String(error);
      await this.finishReminder(reminder.id, 'FAILED', null, reason.slice(0, 500));
      this.logger.error(`Falló el recordatorio de email de la reserva ${booking.id}: ${reason}`);
    }
  }

  private maxIntervalMinutes(organizations: B2bOrganizationEntity[]): number {
    const all = organizations.flatMap((organization) => [
      ...reminderIntervalsFor(organization, 'email'),
      ...reminderIntervalsFor(organization, 'whatsapp'),
    ]);
    return all.length ? Math.max(...all) : Math.max(...DEFAULT_EMAIL_INTERVALS, ...DEFAULT_WHATSAPP_INTERVALS);
  }

  private async claimReminder(bookingId: string, channel: ReminderChannel, minutesBefore: number, now: Date): Promise<B2bBookingReminderEntity | null> {
    try {
      return await this.unitOfWork.execute(async (repositories) => {
        const reminders = repositories.get(B2bBookingReminderEntity);
        const existing = await reminders.findOne({
          where: { bookingId, channel, minutesBefore },
          lock: { mode: 'pessimistic_write' },
        });
        if (existing) {
          if (TERMINAL_STATUSES.includes(existing.status) || existing.status === 'AWAITING_MANUAL') return null;
          if (existing.status === 'PROCESSING' && now.getTime() - existing.updatedAt.getTime() < PROCESSING_LEASE_MS) return null;
          existing.status = 'PROCESSING';
          existing.attempts += 1;
          existing.lastError = null;
          return reminders.save(existing);
        }
        return reminders.save(reminders.create({ bookingId, channel, minutesBefore, status: 'PROCESSING', attempts: 1 }));
      });
    } catch (error) {
      if ((error as { driverError?: { code?: string } })?.driverError?.code === '23505') return null;
      throw error;
    }
  }

  private finishReminder(
    id: string,
    status: B2bBookingReminderEntity['status'],
    provider: string | null,
    lastError: string | null,
  ) {
    return this.reminders.update({ id }, { status, provider, lastError, processedAt: new Date() });
  }
}
