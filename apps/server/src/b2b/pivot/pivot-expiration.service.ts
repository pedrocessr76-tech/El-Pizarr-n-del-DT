import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { inValues, RepositoryPort, UnitOfWork, getRepositoryPortToken } from '../../persistence/repository.port';
import { B2B_UNIT_OF_WORK } from '../../persistence/persistence.module';
import { B2bBookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/b2b.enums';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bPivotRequestEntity } from './b2b-pivot-request.entity';
import { B2bShiftEntity } from '../entities/shift.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bNotificationsService } from '../notifications/b2b-notifications.service';
import { resolveTimeZone, orgDateString, orgTimeString } from '../time';

const POLL_INTERVAL_MS = 5 * 60_000;
const EXPIRY_HOURS_AFTER_SHIFT = 2;

@Injectable()
export class PivotExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PivotExpirationService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    @Inject(getRepositoryPortToken(B2bOrganizationEntity, 'b2b')) private readonly organizations: RepositoryPort<B2bOrganizationEntity>,
    @Inject(getRepositoryPortToken(B2bPivotRequestEntity, 'b2b')) private readonly pivotRequests: RepositoryPort<B2bPivotRequestEntity>,
    @Inject(getRepositoryPortToken(B2bBookingEntity, 'b2b')) private readonly bookings: RepositoryPort<B2bBookingEntity>,
    @Inject(getRepositoryPortToken(B2bShiftEntity, 'b2b')) private readonly shifts: RepositoryPort<B2bShiftEntity>,
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    @Inject(B2B_UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly notifications: B2bNotificationsService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.expireOldRequests(), POLL_INTERVAL_MS);
    this.timer.unref?.();
    void this.expireOldRequests();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async expireOldRequests(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const pendingRequests = await this.pivotRequests.find({
        where: { status: 'PENDING' },
      });
      if (pendingRequests.length === 0) return;

      const bookingIds = [...new Set(pendingRequests.map((r: B2bPivotRequestEntity) => r.bookingId).filter((id): id is string => Boolean(id)))];
      if (bookingIds.length === 0) {
        await this.expireOrphanRequests(pendingRequests, now);
        return;
      }

      const [bookings, shifts] = await Promise.all([
        this.bookings.find({ where: { id: inValues(bookingIds) } }),
        this.bookings.find({ where: { id: inValues(bookingIds) } }).then((bs) => {
          const shiftIds = [...new Set(bs.map((b: B2bBookingEntity) => b.shiftId))];
          return this.shifts.find({ where: { id: inValues(shiftIds) } });
        }),
      ]);

      const bookingById = new Map(bookings.map((b: B2bBookingEntity) => [b.id, b]));
      const shiftById = new Map(shifts.map((s: B2bShiftEntity) => [s.id, s]));

      for (const request of pendingRequests) {
        if (!request.bookingId) continue;
        const booking = bookingById.get(request.bookingId);
        if (!booking) continue;

        if ([BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(booking.status)) {
          await this.expireRequest(request, `La reserva asociada está ${booking.status.toLowerCase()}.`);
          continue;
        }

        const shift = shiftById.get(booking.shiftId);
        if (shift && shift.startsAt.getTime() + EXPIRY_HOURS_AFTER_SHIFT * 60 * 60 * 1000 < now.getTime()) {
          await this.expireRequest(request, 'El turno ya pasó.');
        }
      }

      const orphanRequests = pendingRequests.filter((r: B2bPivotRequestEntity) => !r.bookingId || !bookingById.has(r.bookingId!));
      await this.expireOrphanRequests(orphanRequests, now);
    } catch (error) {
      this.logger.error(`No se pudieron expirar solicitudes pivote: ${(error as Error)?.message ?? error}`);
    } finally {
      this.running = false;
    }
  }

  private async expireOrphanRequests(requests: B2bPivotRequestEntity[], now: Date): Promise<void> {
    const MAX_AGE_HOURS = 24;
    for (const request of requests) {
      const ageHours = (now.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > MAX_AGE_HOURS) {
        await this.expireRequest(request, 'Solicitud sin reserva asociada por más de 24 horas.');
      }
    }
  }

  private async expireRequest(request: B2bPivotRequestEntity, reason: string): Promise<void> {
    try {
      await this.unitOfWork.execute(async (repositories: { get: (entity: any) => RepositoryPort<any> }) => {
        const pivotRequests = repositories.get(B2bPivotRequestEntity);
        const locked = await pivotRequests.findOne({
          where: { id: request.id, status: 'PENDING' },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked) return;
        locked.status = 'DECLINED';
        locked.respondedAt = new Date();
        await pivotRequests.save(locked);
      });

      const [requester, pivot] = await Promise.all([
        this.users.findOne({ where: { id: request.requesterUserId } }),
        this.users.findOne({ where: { id: request.pivotUserId } }),
      ]);

      if (requester) {
        await this.notifications.notifyUser(
          requester.id,
          request.requesterOrganizationId,
          {
            type: 'pivot_contact_request',
            severity: 'warning',
            title: 'Solicitud de pivote expirada',
            body: reason,
            metadata: { conversationId: request.id, bookingId: request.bookingId },
          },
          request.pivotUserId,
        );
      }

      if (pivot) {
        await this.notifications.notifyUser(
          pivot.id,
          request.pivotOrganizationId,
          {
            type: 'pivot_contact_request',
            severity: 'warning',
            title: 'Solicitud de pivote expirada',
            body: reason,
            metadata: { conversationId: request.id, bookingId: request.bookingId },
          },
          request.requesterUserId,
        );
      }

      this.logger.log(`Solicitud pivote ${request.id} expirada: ${reason}`);
    } catch (error) {
      this.logger.error(`Falló expirar solicitud ${request.id}: ${(error as Error)?.message ?? error}`);
    }
  }
}