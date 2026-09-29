import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { betweenValues, inValues, RepositoryPort, UnitOfWork, getRepositoryPortToken } from '../persistence/repository.port';
import { B2B_UNIT_OF_WORK } from '../persistence/persistence.module';
import { B2bBookingEntity } from './entities/booking.entity';
import { B2bBookingReminderEntity } from './entities/booking-reminder.entity';
import { BookingStatus } from './entities/b2b.enums';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bUserEntity } from './entities/user.entity';
import { canSendWhatsApp } from './domain-policy';
import { MessagingService } from './messaging/messaging.service';
import { orgDateString, orgTimeString, resolveTimeZone } from './time';

const DEFAULT_INTERVALS = [1440, 60];
const MAX_INTERVAL_MINUTES = 7 * 24 * 60;
const POLL_INTERVAL_MS = 60_000;
const PROCESSING_LEASE_MS = 10 * 60_000;

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
      const maxInterval = Math.max(...organizations.flatMap((organization) => this.intervalsFor(organization)));
      const activeBookings = await this.bookings.find({
        where: { status: inValues([BookingStatus.PENDING, BookingStatus.CONFIRMED]) },
      });
      if (activeBookings.length === 0) return;

      const from = now;
      const to = new Date(now.getTime() + maxInterval * 60_000);
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
        for (const minutesBefore of this.intervalsFor(organization)) {
          const dueAt = shift.startsAt.getTime() - minutesBefore * 60_000;
          if (dueAt > now.getTime()) continue;
          const reminder = await this.claimReminder(booking.id, minutesBefore, now);
          if (!reminder) continue;

          const client = userById.get(booking.clientUserId);
          if (!client || !canSendWhatsApp(client.whatsappPhone, client.whatsappOptIn)) {
            await this.finishReminder(reminder.id, 'SKIPPED', null, 'Cliente sin teléfono o consentimiento WhatsApp.');
            this.logger.log(`Recordatorio omitido para reserva ${booking.id}: falta teléfono o consentimiento WhatsApp.`);
            continue;
          }

          const timezone = resolveTimeZone(organization.timezone);
          const when = `${orgDateString(shift.startsAt, timezone)} a las ${orgTimeString(shift.startsAt, timezone)}`;
          const courtName = courtById.get(booking.courtId)?.name ?? 'la cancha';
          const clientName = client.fullName || client.email;
          const body = `Hola ${clientName}, te recordamos tu turno en ${courtName} el ${when}.`;
          try {
            const result = await this.messaging.send(client.whatsappPhone, body, 'reminder', {
              bookingId: booking.id,
              minutesBefore,
            });
            if (!result.delivered) {
              await this.finishReminder(reminder.id, 'FAILED', result.provider, 'El proveedor no confirmó la entrega.');
              continue;
            }
            const status = result.provider === 'log' ? 'SIMULATED' : 'SENT';
            await this.finishReminder(reminder.id, status, result.provider, null);
            if (status === 'SIMULATED') {
              this.logger.warn(`Recordatorio simulado; no se envió a WhatsApp real (reserva ${booking.id}, ${minutesBefore} min).`);
            }
          } catch (error) {
            const reason = (error as Error)?.message ?? String(error);
            await this.finishReminder(reminder.id, 'FAILED', null, reason.slice(0, 500));
            this.logger.error(`Falló el recordatorio de la reserva ${booking.id}: ${reason}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`No se pudieron procesar los recordatorios: ${(error as Error)?.message ?? error}`);
    } finally {
      this.running = false;
    }
  }

  private intervalsFor(organization: B2bOrganizationEntity): number[] {
    const values = organization.whatsappReminderIntervalsMinutes;
    if (!Array.isArray(values) || values.length === 0) return DEFAULT_INTERVALS;
    const valid = values.filter((value) => Number.isInteger(value) && value > 0 && value <= MAX_INTERVAL_MINUTES);
    return valid.length ? valid : DEFAULT_INTERVALS;
  }

  private async claimReminder(bookingId: string, minutesBefore: number, now: Date): Promise<B2bBookingReminderEntity | null> {
    try {
      return await this.unitOfWork.execute(async (repositories) => {
        const reminders = repositories.get(B2bBookingReminderEntity);
        const existing = await reminders.findOne({
          where: { bookingId, minutesBefore },
          lock: { mode: 'pessimistic_write' },
        });
        if (existing) {
          if (['SENT', 'SIMULATED', 'SKIPPED'].includes(existing.status)) return null;
          if (existing.status === 'PROCESSING' && now.getTime() - existing.updatedAt.getTime() < PROCESSING_LEASE_MS) return null;
          existing.status = 'PROCESSING';
          existing.attempts += 1;
          existing.lastError = null;
          return reminders.save(existing);
        }
        return reminders.save(reminders.create({ bookingId, minutesBefore, status: 'PROCESSING', attempts: 1 }));
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
