import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { B2bAvailabilityBlockEntity } from './entities/availability-block.entity';
import { BookingStatus, B2bRoleCode, ShiftStatus } from './entities/b2b.enums';
import { B2bBookingEventEntity } from './entities/booking-event.entity';
import { B2bBookingEntity } from './entities/booking.entity';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bFacilityEntity } from './entities/facility.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bShiftRuleEntity } from './entities/shift-rule.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bUserEntity } from './entities/user.entity';
import { B2bJwtUser } from './auth/b2b-auth.types';
import { canChangeBookingStatus, deriveCourtCapacity, isStaffRole, isValidCourtSize, isValidShiftDuration } from './domain-policy';
import { B2bNotificationsService, B2bNotifyOptions } from './notifications/b2b-notifications.service';

@Injectable()
export class B2bManagementService {
  private readonly logger = new Logger(B2bManagementService.name);
  constructor(
    @InjectRepository(B2bOrganizationEntity, 'b2b') private readonly organizations: Repository<B2bOrganizationEntity>,
    @InjectRepository(B2bFacilityEntity, 'b2b') private readonly facilities: Repository<B2bFacilityEntity>,
    @InjectRepository(B2bCourtEntity, 'b2b') private readonly courts: Repository<B2bCourtEntity>,
    @InjectRepository(B2bShiftRuleEntity, 'b2b') private readonly shiftRules: Repository<B2bShiftRuleEntity>,
    @InjectRepository(B2bShiftEntity, 'b2b') private readonly shifts: Repository<B2bShiftEntity>,
    @InjectRepository(B2bAvailabilityBlockEntity, 'b2b') private readonly blocks: Repository<B2bAvailabilityBlockEntity>,
    @InjectRepository(B2bBookingEntity, 'b2b') private readonly bookings: Repository<B2bBookingEntity>,
    @InjectRepository(B2bBookingEventEntity, 'b2b') private readonly bookingEvents: Repository<B2bBookingEventEntity>,
    @InjectRepository(B2bUserEntity, 'b2b') private readonly users: Repository<B2bUserEntity>,
    private readonly notifications: B2bNotificationsService,
  ) {}

  async getOrganization(user: B2bJwtUser) {
    return this.organizations.findOneByOrFail({ id: user.organizationId });
  }

  async updateOrganization(user: B2bJwtUser, input: { name?: string; address?: string }) {
    const organization = await this.getOrganization(user);
    if (input.name) organization.name = input.name;
    return this.organizations.save(organization);
  }

  listFacilities(user: B2bJwtUser) {
    return this.facilities.find({ where: { organizationId: user.organizationId }, order: { name: 'ASC' } });
  }

  async createFacility(user: B2bJwtUser, input: { name: string; address?: string }) {
    return this.facilities.save(this.facilities.create({
      organizationId: user.organizationId,
      name: input.name,
      address: input.address || null,
    }));
  }

  async updateFacility(user: B2bJwtUser, id: string, input: { name?: string; address?: string; status?: string }) {
    const facility = await this.facilities.findOneBy({ id, organizationId: user.organizationId });
    if (!facility) throw new NotFoundException('Complejo no encontrado');
    Object.assign(facility, input);
    return this.facilities.save(facility);
  }

  async archiveFacility(user: B2bJwtUser, id: string) {
    return this.updateFacility(user, id, { status: 'INACTIVE' });
  }

  async createCourt(user: B2bJwtUser, facilityId: string, input: { name: string; sportType?: string; capacity?: number; defaultPriceCentsArs: number }) {
    const facility = await this.facilities.findOneBy({ id: facilityId, organizationId: user.organizationId });
    if (!facility) throw new NotFoundException('Complejo no encontrado');
    const sportType = input.sportType ?? 'FUTBOL 5';
    if (!isValidCourtSize(sportType)) throw new BadRequestException('Tamaño de cancha inválido; usá Fútbol 5, 7, 8 u 11');
    return this.courts.save(this.courts.create({
      organizationId: user.organizationId,
      facilityId,
      name: input.name,
      sportType,
      capacity: input.capacity ?? deriveCourtCapacity(sportType),
      defaultPriceCentsArs: input.defaultPriceCentsArs,
    }));
  }

  listCourts(user: B2bJwtUser) {
    return this.courts.find({ where: { organizationId: user.organizationId }, order: { name: 'ASC' } });
  }

  async updateCourt(user: B2bJwtUser, id: string, input: { name?: string; sportType?: string; capacity?: number; defaultPriceCentsArs?: number; status?: string }) {
    const court = await this.courts.findOneBy({ id, organizationId: user.organizationId });
    if (!court) throw new NotFoundException('Cancha no encontrada');
    if (input.sportType !== undefined && !isValidCourtSize(input.sportType)) {
      throw new BadRequestException('Tamaño de cancha inválido; usá Fútbol 5, 7, 8 u 11');
    }
    Object.assign(court, input);
    if (input.capacity === undefined && input.sportType !== undefined) {
      court.capacity = deriveCourtCapacity(input.sportType);
    }
    return this.courts.save(court);
  }

  async archiveCourt(user: B2bJwtUser, id: string) {
    return this.updateCourt(user, id, { status: 'INACTIVE' });
  }

  async createShiftRule(user: B2bJwtUser, courtId: string, input: { weekday: number; startTime: string; endTime: string; durationHours: 1 | 2; priceCentsArs: number }) {
    if (!isValidShiftDuration(input.durationHours)) throw new BadRequestException('La duración debe ser 1 o 2 horas');
    await this.getCourt(user, courtId);
    return this.shiftRules.save(this.shiftRules.create({ courtId, ...input }));
  }

  listShiftRules(user: B2bJwtUser, courtId: string) {
    return this.assertCourt(user, courtId).then(() => this.shiftRules.find({ where: { courtId }, order: { weekday: 'ASC', startTime: 'ASC' } }));
  }

  async createBlock(user: B2bJwtUser, courtId: string, input: { startsAt: string; endsAt: string; reason: string }) {
    await this.getCourt(user, courtId);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (!Number.isFinite(startsAt.valueOf()) || !Number.isFinite(endsAt.valueOf()) || startsAt >= endsAt) throw new BadRequestException('El bloqueo tiene un rango inválido');
    if (!input.reason?.trim() || input.reason.trim().length > 240) throw new BadRequestException('Ingresá un motivo de hasta 240 caracteres');
    return this.blocks.save(this.blocks.create({ organizationId: user.organizationId, courtId, startsAt, endsAt, reason: input.reason, createdBy: user.userId }));
  }

  async generateShifts(user: B2bJwtUser, courtId: string, input: { from: string; to: string }) {
    await this.getCourt(user, courtId);
    const from = new Date(input.from);
    const to = new Date(input.to);
    if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from >= to) {
      throw new BadRequestException('El rango de generación es inválido');
    }
    const rules = await this.shiftRules.find({ where: { courtId, active: true } });
    const generated: B2bShiftEntity[] = [];
    for (const rule of rules) {
      const cursor = new Date(from);
      while (cursor < to) {
        if (cursor.getDay() === rule.weekday) {
          const [startHour, startMinute] = rule.startTime.split(':').map(Number);
          const startsAt = new Date(cursor);
          startsAt.setHours(startHour, startMinute, 0, 0);
          const endsAt = new Date(startsAt);
          endsAt.setHours(endsAt.getHours() + rule.durationHours);
          if (startsAt >= from && endsAt <= to) {
            const existing = await this.shifts.findOne({ where: { courtId, startsAt } });
            if (!existing) {
              generated.push(this.shifts.create({
                organizationId: user.organizationId,
                courtId,
                startsAt,
                endsAt,
                priceCentsArs: rule.priceCentsArs,
                status: ShiftStatus.AVAILABLE,
              }));
            }
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return this.shifts.save(generated);
  }

  async availability(user: B2bJwtUser, courtId: string, from: string, to: string) {
    await this.getCourt(user, courtId);
    const startsAt = new Date(from);
    const endsAt = new Date(to);
    const [shifts, blocks] = await Promise.all([
      this.shifts.find({ where: { organizationId: user.organizationId, courtId, startsAt: Between(startsAt, endsAt), status: ShiftStatus.AVAILABLE }, order: { startsAt: 'ASC' } }),
      this.blocks.find({ where: { organizationId: user.organizationId, courtId } }),
    ]);
    return shifts.filter((shift) => !blocks.some((block) => block.startsAt < shift.endsAt && block.endsAt > shift.startsAt));
  }

  /**
   * Disponibilidad semanal para el calendario del admin: por cancha devuelve
   * cada turno del rango con su estado real (libre/reservado/pendiente/bloqueado),
   * mezclando turnos, reservas activas y bloques de disponibilidad.
   */
  async weeklyAvailability(user: B2bJwtUser, from: string, to: string) {
    const startsAt = new Date(from);
    const endsAt = new Date(to);
    const [courts, shifts, bookings, blocks] = await Promise.all([
      this.courts.find({ where: { organizationId: user.organizationId }, order: { name: 'ASC' } }),
      this.shifts.find({ where: { organizationId: user.organizationId, startsAt: Between(startsAt, endsAt) }, order: { startsAt: 'ASC' } }),
      this.bookings.find({ where: { organizationId: user.organizationId, status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]) } }),
      this.blocks.find({ where: { organizationId: user.organizationId } }),
    ]);
    const bookingByShift = new Map(bookings.map((booking) => [booking.shiftId, booking]));
    const clientUserIds = [...new Set(bookings.map((booking) => booking.clientUserId))];
    const users = clientUserIds.length
      ? await this.users.find({ where: { id: In(clientUserIds) } })
      : ([] as B2bUserEntity[]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const board = new Map<string, Array<Record<string, unknown>>>(
      courts.map((court) => [court.id, []]),
    );
    for (const shift of shifts) {
      const blocked = blocks.some((block) => block.startsAt < shift.endsAt && block.endsAt > shift.startsAt);
      const booking = bookingByShift.get(shift.id);
      let state: string;
      if (blocked) state = 'BLOCKED';
      else if (booking) state = booking.status === BookingStatus.PENDING ? 'PENDING' : 'CONFIRMED';
      else state = ShiftStatus.AVAILABLE;
      const lane = board.get(shift.courtId) ?? [];
      const client = booking ? userById.get(booking.clientUserId) : undefined;
      lane.push({ id: shift.id, startsAt: shift.startsAt, endsAt: shift.endsAt, priceCentsArs: shift.priceCentsArs, state, clientName: client?.fullName ?? client?.email ?? null });
      board.set(shift.courtId, lane);
    }
    return courts.map((court) => ({
      courtId: court.id,
      courtName: court.name,
      sportType: court.sportType,
      facilityId: court.facilityId,
      lanes: board.get(court.id) ?? [],
    }));
  }

  async listBookings(user: B2bJwtUser) {
    const where = user.roles.includes(B2bRoleCode.CLIENT) && !user.roles.some((role) => [B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR].includes(role))
      ? { organizationId: user.organizationId, clientUserId: user.userId }
      : { organizationId: user.organizationId };
    const rows = await this.bookings.find({ where, order: { createdAt: 'DESC' } });
    if (rows.length === 0) return [];
    // Enriquecimiento explícito (sin relaciones TypeORM): hora del turno y datos de la cancha
    // para que la bandeja del frontend muestre el horario real en lugar de un placeholder.
    const shiftIds = [...new Set(rows.map((row) => row.shiftId))];
    const courtIds = [...new Set(rows.map((row) => row.courtId).filter((id): id is string => Boolean(id)))];
    const clientUserIds = [...new Set(rows.map((row) => row.clientUserId).filter((id): id is string => Boolean(id)))];
    const [shifts, courts, users] = await Promise.all([
      this.shifts.find({ where: { id: In(shiftIds) } }),
      courtIds.length ? this.courts.find({ where: { id: In(courtIds) } }) : Promise.resolve([] as B2bCourtEntity[]),
      clientUserIds.length ? this.users.find({ where: { id: In(clientUserIds) } }) : Promise.resolve([] as B2bUserEntity[]),
    ]);
    const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
    const courtById = new Map(courts.map((court) => [court.id, court]));
    const userById = new Map(users.map((user) => [user.id, user]));
    return rows.map((row) => {
      const shift = shiftById.get(row.shiftId);
      const court = courtById.get(row.courtId);
      const client = userById.get(row.clientUserId);
      return {
        ...row,
        shiftStartsAt: shift?.startsAt ?? null,
        shiftEndsAt: shift?.endsAt ?? null,
        courtName: court?.name ?? null,
        courtSportType: court?.sportType ?? null,
        clientName: client?.fullName ?? client?.email ?? null,
      };
    });
  }

  async metricsSummary(user: B2bJwtUser, date = new Date(), courtId?: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const shiftWhere: Record<string, unknown> = { organizationId: user.organizationId, startsAt: Between(start, end) };
    const bookingWhere: Record<string, unknown> = { organizationId: user.organizationId };
    if (courtId) {
      shiftWhere.courtId = courtId;
      bookingWhere.courtId = courtId;
    }
    const shifts = await this.shifts.find({ where: shiftWhere });
    const bookings = await this.bookings.find({ where: bookingWhere });
    const activeBookings = bookings.filter((booking) => [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status));
    const bookedShiftIds = new Set(activeBookings.map((booking) => booking.shiftId));
    const revenueCentsArs = bookings
      .filter((booking) => [BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(booking.status))
      .reduce((total, booking) => total + booking.priceCentsArs, 0);
    return {
      date: start.toISOString().slice(0, 10),
      currency: 'ARS',
      totalShifts: shifts.length,
      occupiedShifts: shifts.filter((shift) => bookedShiftIds.has(shift.id)).length,
      availableShifts: shifts.filter((shift) => !bookedShiftIds.has(shift.id) && shift.status === ShiftStatus.AVAILABLE).length,
      pendingBookings: bookings.filter((booking) => booking.status === BookingStatus.PENDING).length,
      confirmedBookings: bookings.filter((booking) => booking.status === BookingStatus.CONFIRMED).length,
      cancelledBookings: bookings.filter((booking) => booking.status === BookingStatus.CANCELLED).length,
      revenueCentsArs,
    };
  }

  async createBooking(user: B2bJwtUser, input: { courtId: string; shiftId: string; notes?: string }) {
    await this.getCourt(user, input.courtId);
    const shift = await this.shifts.findOne({ where: { id: input.shiftId, courtId: input.courtId, organizationId: user.organizationId } });
    if (!shift || shift.status !== ShiftStatus.AVAILABLE) throw new ConflictException('El turno no está disponible');
    await this.assertUnblocked(shift);
    const existing = await this.bookings.findOne({ where: { shiftId: shift.id, status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]) } });
    if (existing) throw new ConflictException('El turno ya fue reservado');
    const booking = await this.bookings.save(this.bookings.create({
      organizationId: user.organizationId,
      courtId: input.courtId,
      shiftId: input.shiftId,
      clientUserId: user.userId,
      status: BookingStatus.PENDING,
      priceCentsArs: shift.priceCentsArs,
      notes: input.notes || null,
    }));
    shift.status = ShiftStatus.BOOKED;
    await this.shifts.save(shift);
    // Los efectos posteriores al alta (evento + notificación al staff) nunca
    // deben tumbar la reserva ya creada: si fallan, se registran y la reserva
    // queda igual (PENDING). Antes, un fallo aquí devolvía 500 al cliente
    // aunque la reserva ya existiera en el admin.
    try {
      await this.recordEvent(booking.id, user.userId, null, BookingStatus.PENDING);
      await this.notifications.notifyStaff(
        user.organizationId,
        await this.bookingNotification(booking, 'b2b_booking_pending', 'info'),
        user.userId,
      );
    } catch (error) {
      this.logger.error(
        `createBooking ${booking.id}: reserva creada pero fallaron los efectos (evento/notificación): ${(error as Error)?.message ?? error}`,
      );
    }
    return booking;
  }

  async transitionBooking(user: B2bJwtUser, id: string, status: BookingStatus) {
    const booking = await this.bookings.findOne({ where: { id, organizationId: user.organizationId } });
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    const isStaff = user.roles.some(isStaffRole);
    if (!isStaff && booking.clientUserId !== user.userId) throw new ForbiddenException('No puede modificar esta reserva');
    if (!canChangeBookingStatus(booking.status, status, isStaff)) throw new ForbiddenException('Transición de reserva no permitida');
    const previous = booking.status;
    booking.status = status;
    const saved = await this.bookings.save(booking);
    if (status === BookingStatus.CANCELLED) {
      await this.shifts.update({ id: booking.shiftId }, { status: ShiftStatus.AVAILABLE });
    }
    await this.recordEvent(booking.id, user.userId, previous, status);

    if (status === BookingStatus.CONFIRMED) {
      await this.notifications.notifyUser(
        booking.clientUserId,
        booking.organizationId,
        await this.bookingNotification(booking, 'b2b_booking_confirmed', 'success'),
        user.userId,
      );
    } else if (status === BookingStatus.COMPLETED) {
      await this.notifications.notifyUser(
        booking.clientUserId,
        booking.organizationId,
        await this.bookingNotification(booking, 'b2b_booking_completed', 'success'),
        user.userId,
      );
    } else if (status === BookingStatus.CANCELLED) {
      const notification = await this.bookingNotification(booking, 'b2b_booking_cancelled', 'warning');
      if (isStaff) {
        await this.notifications.notifyUser(booking.clientUserId, booking.organizationId, notification, user.userId);
      } else {
        await this.notifications.notifyStaff(booking.organizationId, notification, user.userId);
      }
    }

    return saved;
  }

  async rescheduleBooking(user: B2bJwtUser, id: string, shiftId: string) {
    const booking = await this.bookings.findOne({ where: { id, organizationId: user.organizationId } });
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    const isStaff = user.roles.some(isStaffRole);
    if (!isStaff && booking.clientUserId !== user.userId) throw new ForbiddenException('No puede modificar esta reserva');
    const shift = await this.shifts.findOne({ where: { id: shiftId, organizationId: user.organizationId, status: ShiftStatus.AVAILABLE } });
    if (!shift) throw new ConflictException('El nuevo turno no está disponible');
    await this.assertUnblocked(shift);
    const previousShiftId = booking.shiftId;
    booking.shiftId = shift.id;
    booking.courtId = shift.courtId;
    booking.priceCentsArs = shift.priceCentsArs;
    await this.shifts.update({ id: previousShiftId }, { status: ShiftStatus.AVAILABLE });
    await this.shifts.update({ id: shift.id }, { status: ShiftStatus.BOOKED });
    const saved = await this.bookings.save(booking);
    await this.recordEvent(booking.id, user.userId, booking.status, booking.status);
    const notification = await this.bookingNotification(booking, 'b2b_booking_rescheduled', 'info');
    if (isStaff) {
      await this.notifications.notifyUser(booking.clientUserId, booking.organizationId, notification, user.userId);
    } else {
      await this.notifications.notifyStaff(booking.organizationId, notification, user.userId);
    }
    return saved;
  }

  private async assertUnblocked(shift: B2bShiftEntity) {
    const blocks = await this.blocks.find({ where: { organizationId: shift.organizationId, courtId: shift.courtId } });
    if (blocks.some((block) => block.startsAt < shift.endsAt && block.endsAt > shift.startsAt)) {
      throw new ConflictException('El turno está bloqueado');
    }
  }

  private async bookingNotification(
    booking: B2bBookingEntity,
    type: 'b2b_booking_pending' | 'b2b_booking_confirmed' | 'b2b_booking_cancelled' | 'b2b_booking_completed' | 'b2b_booking_rescheduled',
    severity: 'info' | 'success' | 'warning',
  ): Promise<B2bNotifyOptions> {
    const [shift, court] = await Promise.all([
      this.shifts.findOneBy({ id: booking.shiftId }),
      this.courts.findOneBy({ id: booking.courtId }),
    ]);
    const titles: Record<string, string> = {
      b2b_booking_pending: 'Nueva reserva',
      b2b_booking_confirmed: 'Reserva confirmada',
      b2b_booking_cancelled: 'Reserva cancelada',
      b2b_booking_completed: 'Reserva completada',
      b2b_booking_rescheduled: 'Reserva reprogramada',
    };
    const courtName = court?.name ?? 'la cancha';
    const clientName = await this.notifications.getUserDisplayName(booking.clientUserId);
    return {
      type,
      severity,
      title: `${titles[type]} — ${courtName}`,
      body: `${this.formatShiftTime(shift)} • cliente ${clientName}`,
      metadata: {
        bookingId: booking.id,
        courtId: booking.courtId,
        courtName,
        shiftStartsAt: shift?.startsAt.toISOString() ?? null,
        clientUserId: booking.clientUserId,
      },
    };
  }

  private formatShiftTime(shift: B2bShiftEntity | undefined | null): string {
    if (!shift) return 'sin horario definido';
    return `${shift.startsAt.toLocaleDateString('es-AR')} ${shift.startsAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  private async recordEvent(bookingId: string, actorUserId: string, fromStatus: string | null, toStatus: string) {
    return this.bookingEvents.save(this.bookingEvents.create({ bookingId, actorUserId, fromStatus, toStatus, metadata: {} }));
  }

  private async assertCourt(user: B2bJwtUser, courtId: string) {
    const court = await this.courts.findOneBy({ id: courtId, organizationId: user.organizationId });
    if (!court) throw new NotFoundException('Cancha no encontrada');
    return court;
  }

  private getCourt(user: B2bJwtUser, courtId: string) {
    return this.assertCourt(user, courtId);
  }
}