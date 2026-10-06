import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { betweenValues, inValues, RepositoryCriteria, RepositoryPort, UnitOfWork, getRepositoryPortToken } from '../persistence/repository.port';
import { B2B_UNIT_OF_WORK } from '../persistence/persistence.module';
import { B2bAvailabilityBlockEntity } from './entities/availability-block.entity';
import { BookingStatus, B2bRecordStatus, B2bRoleCode, ShiftStatus } from './entities/b2b.enums';
import { B2bBookingEventEntity } from './entities/booking-event.entity';
import { B2bBookingEntity } from './entities/booking.entity';
import { B2bBookingPaymentProofEntity, BookingPaymentMethod, BookingPaymentType } from './entities/booking-payment-proof.entity';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bFacilityEntity } from './entities/facility.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bShiftRuleEntity } from './entities/shift-rule.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bUserEntity } from './entities/user.entity';
import { B2bJwtUser } from './auth/b2b-auth.types';
import { canChangeBookingStatus, canSendWhatsApp, deriveCourtCapacity, isStaffRole, isValidCourtSize, isValidShiftDuration } from './domain-policy';
import { B2bNotificationsService, B2bNotifyOptions } from './notifications/b2b-notifications.service';
import { MessagingService } from './messaging/messaging.service';
import { MessageKind } from './messaging/messaging.types';
import { addOrgDays, addOrgHours, orgDateString, orgParts, orgTimeString, orgTimeToDate, resolveTimeZone, startOfOrgDay } from './time';

const MAX_REMINDER_INTERVALS = 5;
const MAX_REMINDER_INTERVAL_MINUTES = 7 * 24 * 60;

/**
 * Franja con la que nace agenda una cancha nueva: todos los días, de 15:00 a
 * 23:00, en turnos de una hora. Centralizado acá para que el nombre del negocio
 * (qué hora abre) no esté repetido en la lógica.
 */
const DEFAULT_COURT_START_HOUR = 15;
const DEFAULT_COURT_SLOTS = 8; // 15, 16, ... 22 -> último turno cierra 23:00

/**
 * Normaliza una lista de anticipaciones (#34). Una lista vacía es válida y
 * significa "no generar recordatorios por este canal"; cualquier otro valor
 * inválido se rechaza conservando la configuración previa.
 */
function validateReminderIntervals(intervals: number[]): number[] {
  if (!Array.isArray(intervals) || intervals.length > MAX_REMINDER_INTERVALS ||
      intervals.some((minutes) => !Number.isInteger(minutes) || minutes < 5 || minutes > MAX_REMINDER_INTERVAL_MINUTES)) {
    throw new BadRequestException(`Elegí hasta ${MAX_REMINDER_INTERVALS} anticipaciones de 5 minutos a 7 días, o una lista vacía.`);
  }
  return [...new Set(intervals)].sort((a, b) => b - a);
}

@Injectable()
export class B2bManagementService {
  private readonly logger = new Logger(B2bManagementService.name);
  constructor(
    @Inject(getRepositoryPortToken(B2bOrganizationEntity, 'b2b')) private readonly organizations: RepositoryPort<B2bOrganizationEntity>,
    @Inject(getRepositoryPortToken(B2bFacilityEntity, 'b2b')) private readonly facilities: RepositoryPort<B2bFacilityEntity>,
    @Inject(getRepositoryPortToken(B2bCourtEntity, 'b2b')) private readonly courts: RepositoryPort<B2bCourtEntity>,
    @Inject(getRepositoryPortToken(B2bShiftRuleEntity, 'b2b')) private readonly shiftRules: RepositoryPort<B2bShiftRuleEntity>,
    @Inject(getRepositoryPortToken(B2bShiftEntity, 'b2b')) private readonly shifts: RepositoryPort<B2bShiftEntity>,
    @Inject(getRepositoryPortToken(B2bAvailabilityBlockEntity, 'b2b')) private readonly blocks: RepositoryPort<B2bAvailabilityBlockEntity>,
    @Inject(getRepositoryPortToken(B2bBookingEntity, 'b2b')) private readonly bookings: RepositoryPort<B2bBookingEntity>,
    @Inject(getRepositoryPortToken(B2bBookingEventEntity, 'b2b')) private readonly bookingEvents: RepositoryPort<B2bBookingEventEntity>,
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    private readonly notifications: B2bNotificationsService,
    @Inject(B2B_UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly messaging: MessagingService,
    @Optional() @Inject(getRepositoryPortToken(B2bBookingPaymentProofEntity, 'b2b')) private readonly paymentProofs?: RepositoryPort<B2bBookingPaymentProofEntity>,
  ) {}

  async getOrganization(user: B2bJwtUser) {
    return this.organizations.findOneByOrFail({ id: user.organizationId });
  }

  async updateOrganization(user: B2bJwtUser, input: {
    name?: string;
    address?: string;
    emailReminderIntervalsMinutes?: number[];
    whatsappReminderIntervalsMinutes?: number[];
  }) {
    const organization = await this.getOrganization(user);
    if (input.name) organization.name = input.name;
    if (input.emailReminderIntervalsMinutes !== undefined) {
      organization.emailReminderIntervalsMinutes = validateReminderIntervals(input.emailReminderIntervalsMinutes);
    }
    if (input.whatsappReminderIntervalsMinutes !== undefined) {
      organization.whatsappReminderIntervalsMinutes = validateReminderIntervals(input.whatsappReminderIntervalsMinutes);
    }
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
    const court = await this.courts.save(this.courts.create({
      organizationId: user.organizationId,
      facilityId,
      name: input.name,
      sportType,
      capacity: input.capacity ?? deriveCourtCapacity(sportType),
      defaultPriceCentsArs: input.defaultPriceCentsArs,
    }));
    // Agenda inicial automática: todos los días de 15:00 a 23:00 en turnos de 1 h,
    // más los turnos concretos de los próximos 7 días, para que la cancha se
    // pueda reservar de inmediato sin configuración manual.
    //
    // Una regla es UN turno, no una franja: el generador usa el startTime de la
    // regla y su duración, así que una sola regla 15:00–23:00 abriría únicamente
    // el primer horario (15–16) y dejaría el resto de la tarde sin turnos.
    const defaultSlots = Array.from({ length: DEFAULT_COURT_SLOTS }, (_, i) => {
      const hour = DEFAULT_COURT_START_HOUR + i;
      return {
        startTime: `${String(hour).padStart(2, '0')}:00`,
        endTime: `${String(hour + 1).padStart(2, '0')}:00`,
      };
    });
    await this.shiftRules.save(
      defaultSlots.flatMap((slot) =>
        // 0 = domingo (ver `orgParts`): un slot por día de la semana.
        Array.from({ length: 7 }, (_, weekday) =>
          this.shiftRules.create({
            courtId: court.id,
            weekday,
            ...slot,
            durationHours: 1,
            priceCentsArs: court.defaultPriceCentsArs,
          }),
        ),
      ),
    );
    const timezone = await this.orgTimezone(user.organizationId);
    const from = startOfOrgDay(new Date(), timezone);
    const to = addOrgDays(from, 7, timezone);
    await this.generateShiftsForRange(user.organizationId, court.id, from, to, timezone);
    return court;
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

  async deleteShiftRule(user: B2bJwtUser, courtId: string, ruleId: string) {
    await this.getCourt(user, courtId);
    const rule = await this.shiftRules.findOne({ where: { id: ruleId, courtId } });
    if (!rule) throw new NotFoundException('Regla de turno no encontrada');
    await this.shiftRules.delete({ id: ruleId, courtId });
    return { deleted: true };
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
    return this.generateShiftsForRange(user.organizationId, courtId, from, to, await this.orgTimezone(user.organizationId));
  }

  async generateMonthlyShifts(user: B2bJwtUser, courtId: string) {
    await this.getCourt(user, courtId);
    const timeZone = await this.orgTimezone(user.organizationId);
    const today = orgParts(new Date(), timeZone);
    const from = orgTimeToDate({ year: today.year, month: today.month, day: 1, hour: 0, minute: 0 }, timeZone);
    const to = orgTimeToDate({ year: today.year, month: today.month + 1, day: 1, hour: 0, minute: 0 }, timeZone);
    return this.generateShiftsForRange(user.organizationId, courtId, from, to, timeZone);
  }

  private async generateShiftsForRange(organizationId: string, courtId: string, from: Date, to: Date, timeZone: string) {
    const rules = await this.shiftRules.find({ where: { courtId, active: true } });
    const existingShifts = await this.shifts.find({ where: { courtId, startsAt: betweenValues(from, to) } });
    const inRange = existingShifts.filter((shift) => {
      const startsAt = new Date(shift.startsAt).getTime();
      return startsAt >= from.getTime() && startsAt < to.getTime();
    });
    const expectedStarts = new Map<number, { startsAt: Date; endsAt: Date; priceCentsArs: number }>();

    for (const rule of rules) {
      let cursor = startOfOrgDay(from, timeZone);
      while (cursor < to) {
        const parts = orgParts(cursor, timeZone);
        if (parts.weekday === rule.weekday) {
          const [startHour, startMinute] = rule.startTime.split(':').map(Number);
          const startsAt = orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day, hour: startHour, minute: startMinute }, timeZone);
          const endsAt = addOrgHours(startsAt, rule.durationHours, timeZone);
          if (startsAt >= from && startsAt < to && endsAt <= to) {
            expectedStarts.set(startsAt.getTime(), { startsAt, endsAt, priceCentsArs: rule.priceCentsArs });
          }
        }
        cursor = addOrgDays(cursor, 1, timeZone);
      }
    }

    const staleShifts = inRange.filter((shift) =>
      shift.status === ShiftStatus.AVAILABLE && !expectedStarts.has(new Date(shift.startsAt).getTime()),
    );
    await Promise.all(staleShifts.map((shift) => this.shifts.update({ id: shift.id }, { status: ShiftStatus.BLOCKED })));

    const existingStarts = new Set(inRange.map((shift) => new Date(shift.startsAt).getTime()));
    const changedShifts = inRange.filter((shift) => {
      if (shift.status !== ShiftStatus.AVAILABLE && shift.status !== ShiftStatus.BLOCKED) return false;
      const expected = expectedStarts.get(new Date(shift.startsAt).getTime());
      return expected !== undefined && (
        shift.status !== ShiftStatus.AVAILABLE ||
        new Date(shift.endsAt).getTime() !== expected.endsAt.getTime() ||
        shift.priceCentsArs !== expected.priceCentsArs
      );
    });
    await Promise.all(changedShifts.map((shift) => {
      const expected = expectedStarts.get(new Date(shift.startsAt).getTime())!;
      return this.shifts.update({ id: shift.id }, { status: ShiftStatus.AVAILABLE, endsAt: expected.endsAt, priceCentsArs: expected.priceCentsArs });
    }));

    const generated: B2bShiftEntity[] = [];
    for (const [startsAtValue, slot] of expectedStarts) {
      if (existingStarts.has(startsAtValue)) continue;
      generated.push(this.shifts.create({
        organizationId,
        courtId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        priceCentsArs: slot.priceCentsArs,
        status: ShiftStatus.AVAILABLE,
      }));
    }
    return this.shifts.save(generated);
  }

  async availability(user: B2bJwtUser, courtId: string, from: string, to: string) {
    await this.getCourt(user, courtId);
    const startsAt = new Date(from);
    const endsAt = new Date(to);
    const [shifts, blocks] = await Promise.all([
      this.shifts.find({ where: { organizationId: user.organizationId, courtId, startsAt: betweenValues(startsAt, endsAt), status: ShiftStatus.AVAILABLE }, order: { startsAt: 'ASC' } }),
      this.blocks.find({ where: { organizationId: user.organizationId, courtId } }),
    ]);
    return shifts
      .filter((shift) => new Date(shift.startsAt).getTime() > Date.now())
      .filter((shift) => !blocks.some((block) => block.startsAt < shift.endsAt && block.endsAt > shift.startsAt));
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
      this.shifts.find({ where: { organizationId: user.organizationId, startsAt: betweenValues(startsAt, endsAt) }, order: { startsAt: 'ASC' } }),
      this.bookings.find({ where: { organizationId: user.organizationId, status: inValues([BookingStatus.PENDING, BookingStatus.CONFIRMED]) } }),
      this.blocks.find({ where: { organizationId: user.organizationId } }),
    ]);
    const bookingByShift = new Map(bookings.map((booking) => [booking.shiftId, booking]));
    const clientUserIds = [...new Set(bookings.map((booking) => booking.clientUserId))];
    const users = clientUserIds.length
      ? await this.users.find({ where: { id: inValues(clientUserIds) } })
      : ([] as B2bUserEntity[]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const board = new Map<string, Array<Record<string, unknown>>>(
      courts.map((court) => [court.id, []]),
    );
    for (const shift of shifts) {
      const blocked = blocks.some((block) => block.startsAt < shift.endsAt && block.endsAt > shift.startsAt);
      const booking = bookingByShift.get(shift.id);
      let state: string;
      if (blocked || shift.status === ShiftStatus.BLOCKED) state = 'BLOCKED';
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
    const [shifts, courts, users, proofs] = await Promise.all([
      this.shifts.find({ where: { id: inValues(shiftIds) } }),
      courtIds.length ? this.courts.find({ where: { id: inValues(courtIds) } }) : Promise.resolve([] as B2bCourtEntity[]),
      clientUserIds.length ? this.users.find({ where: { id: inValues(clientUserIds) } }) : Promise.resolve([] as B2bUserEntity[]),
      this.paymentProofs
        ? this.paymentProofs.find({ where: { bookingId: inValues(rows.map((row) => row.id)) } })
        : Promise.resolve([] as B2bBookingPaymentProofEntity[]),
    ]);
    const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
    const courtById = new Map(courts.map((court) => [court.id, court]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const proofByBookingId = new Map(proofs.map((proof) => [proof.bookingId, proof]));
    return rows.map((row) => {
      const shift = shiftById.get(row.shiftId);
      const court = courtById.get(row.courtId);
      const client = userById.get(row.clientUserId);
      const proof = proofByBookingId.get(row.id);
      return {
        ...row,
        shiftStartsAt: shift?.startsAt ?? null,
        shiftEndsAt: shift?.endsAt ?? null,
        courtName: court?.name ?? null,
        courtSportType: court?.sportType ?? null,
        clientName: client?.fullName ?? client?.email ?? null,
        paymentProof: proof ? {
          paymentType: proof.paymentType,
          paymentMethod: proof.paymentMethod,
          fileName: proof.fileName,
          contentType: proof.contentType,
          uploadedAt: proof.uploadedAt,
        } : null,
      };
    });
  }

  async uploadBookingPaymentProof(user: B2bJwtUser, bookingId: string, input: {
    paymentType: BookingPaymentType;
    paymentMethod: BookingPaymentMethod;
    fileName: string;
    contentType: string;
    fileData: Buffer;
  }) {
    const booking = await this.bookings.findOne({ where: { id: bookingId, organizationId: user.organizationId } });
    if (!booking || booking.clientUserId !== user.userId) throw new NotFoundException('Reserva no encontrada.');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Solo podés adjuntar comprobantes a reservas activas.');
    }

    const bytes = input.fileData;
    if (!bytes?.length || bytes.length > 5 * 1024 * 1024) {
      throw new BadRequestException('El comprobante debe pesar hasta 5 MB.');
    }
    const signatures: Record<string, (data: Buffer) => boolean> = {
      'image/jpeg': (data) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
      'image/png': (data) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      'image/webp': (data) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP',
      'application/pdf': (data) => data.subarray(0, 5).toString('ascii') === '%PDF-',
    };
    if (!signatures[input.contentType]?.(bytes)) throw new BadRequestException('El formato no coincide con el contenido del comprobante.');

    const fileName = input.fileName.replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 255) || 'comprobante';
    const paymentProofs = this.paymentProofRepository();
    const existing = await paymentProofs.findOne({ where: { bookingId } });
    const proof = paymentProofs.create({
      ...(existing ?? {}),
      bookingId,
      uploadedBy: user.userId,
      paymentType: input.paymentType,
      paymentMethod: input.paymentMethod,
      fileName,
      contentType: input.contentType,
      fileData: bytes,
    });
    const saved = await paymentProofs.save(proof);
    await this.notifications.notifyStaff(booking.organizationId, {
      type: 'b2b_booking_payment_proof',
      severity: 'info',
      title: 'Nuevo comprobante de pago',
      body: 'Un cliente adjuntó un comprobante a una reserva.',
      metadata: { bookingId, paymentType: saved.paymentType },
    }, user.userId);
    return {
      bookingId: saved.bookingId,
      paymentType: saved.paymentType,
      paymentMethod: saved.paymentMethod,
      fileName: saved.fileName,
      contentType: saved.contentType,
      uploadedAt: saved.uploadedAt,
    };
  }

  async getBookingPaymentProof(user: B2bJwtUser, bookingId: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId, organizationId: user.organizationId } });
    if (!booking || (!user.roles.some(isStaffRole) && booking.clientUserId !== user.userId)) {
      throw new NotFoundException('Comprobante no encontrado.');
    }
    const proof = await this.paymentProofRepository().findOne({ where: { bookingId } });
    if (!proof) return null;
    return {
      bookingId: proof.bookingId,
      paymentType: proof.paymentType,
      paymentMethod: proof.paymentMethod,
      fileName: proof.fileName,
      contentType: proof.contentType,
      uploadedAt: proof.uploadedAt,
      dataBase64: proof.fileData.toString('base64'),
    };
  }

  async sendBookingPaymentReminder(user: B2bJwtUser, bookingId: string) {
    if (!user.roles.some(isStaffRole)) throw new ForbiddenException('Solo el personal puede enviar recordatorios de pago.');
    const booking = await this.bookings.findOne({ where: { id: bookingId, organizationId: user.organizationId } });
    if (!booking || ![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new NotFoundException('Reserva activa no encontrada.');
    }
    const [client, court, shift] = await Promise.all([
      this.users.findOne({ where: { id: booking.clientUserId } }),
      this.courts.findOne({ where: { id: booking.courtId } }),
      this.shifts.findOne({ where: { id: booking.shiftId } }),
    ]);
    if (!client?.email || !court || !shift) throw new BadRequestException('Faltan datos de contacto o del turno para enviar el recordatorio.');
    const organization = await this.getOrganization(user);
    const timeZone = resolveTimeZone(organization.timezone);
    const result = await this.messaging.sendEmail(
      client.email,
      `Hola ${client.fullName || ''}, te recordamos que tu reserva en ${court.name} es el ${orgDateString(shift.startsAt, timeZone)} a las ${orgTimeString(shift.startsAt, timeZone)}. Si ya realizaste el pago, podés adjuntar el comprobante desde Mis reservas.`,
      'Recordatorio de pago de reserva',
      'payment',
      { bookingId },
    );
    await this.notifications.notifyUser(client.id, booking.organizationId, {
      type: 'b2b_booking_payment_proof',
      severity: 'info',
      title: 'Recordatorio de pago',
      body: `Revisá el pago de tu reserva en ${court.name}.`,
      metadata: { bookingId },
    }, user.userId);
    return { delivered: result.delivered, provider: result.provider };
  }

  async metricsSummary(user: B2bJwtUser, date?: string, courtId?: string) {
    const timeZone = await this.orgTimezone(user.organizationId);
    const match = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (date && !match) throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const probe = new Date(Date.UTC(year, month - 1, day));
      if (probe.getUTCFullYear() !== year || probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day) {
        throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
      }
    }
    const now = new Date();
    const parts = match
      ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
      : orgParts(now, timeZone);
    // El "día" de las métricas es el día local del complejo, no el del servidor.
    const start = orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0 }, timeZone);
    const end = addOrgDays(start, 1, timeZone);
    const shiftWhere: RepositoryCriteria<B2bShiftEntity> = { organizationId: user.organizationId, startsAt: betweenValues(start, end) };
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
    const pad2 = (value: number) => String(value).padStart(2, '0');
    return {
      date: `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`,
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
    let booking!: B2bBookingEntity;
    try {
      // Transacción con bloqueo de fila (SELECT ... FOR UPDATE) sobre el turno:
      // dos reservas concurrentes del mismo turno se serializan y quien pierde
      // la carrera relee el turno ya BOOKED (issue #18).
      booking = await this.unitOfWork.execute(async (repositories) => {
        const shifts = repositories.get(B2bShiftEntity);
        const bookings = repositories.get(B2bBookingEntity);
        const shift = await shifts.findOne({
          where: { id: input.shiftId, courtId: input.courtId, organizationId: user.organizationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!shift || shift.status !== ShiftStatus.AVAILABLE || new Date(shift.startsAt).getTime() <= Date.now()) throw new ConflictException('El turno no está disponible o ya pasó');
        await this.assertUnblocked(shift, repositories.get(B2bAvailabilityBlockEntity));
        const existing = await bookings.find({ where: { shiftId: shift.id, status: inValues([BookingStatus.PENDING, BookingStatus.CONFIRMED]) } }).then((items) => items[0] ?? null);
        if (existing) throw new ConflictException('El turno ya fue reservado');
        const saved = await bookings.save(
          bookings.create({
            organizationId: user.organizationId,
            courtId: input.courtId,
            shiftId: input.shiftId,
            clientUserId: user.userId,
            status: BookingStatus.PENDING,
            priceCentsArs: shift.priceCentsArs,
            notes: input.notes || null,
          }),
        );
        await shifts.update({ id: shift.id }, { status: ShiftStatus.BOOKED });
        return saved;
      });
    } catch (error) {
      // El índice parcial único de b2b_bookings es la red de seguridad final:
      // ante una carrera que el bloqueo de fila no alcanzó, se reporta 409.
      if ((error as { driverError?: { code?: string } })?.driverError?.code === '23505') {
        throw new ConflictException('El turno ya fue reservado');
      }
      throw error;
    }
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
    const isStaff = user.roles.some(isStaffRole);
    let saved!: B2bBookingEntity;
    let previous!: BookingStatus;
    await this.unitOfWork.execute(async (repositories) => {
      // Bloqueo de fila sobre la reserva: una cancelación concurrente con una
      // reprogramación no puede dejar el turno liberado o tomado dos veces.
      const bookings = repositories.get(B2bBookingEntity);
      const shifts = repositories.get(B2bShiftEntity);
      const booking = await bookings.findOne({
        where: { id, organizationId: user.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Reserva no encontrada');
      if (!isStaff && booking.clientUserId !== user.userId) throw new ForbiddenException('No puede modificar esta reserva');
      if (!canChangeBookingStatus(booking.status, status, isStaff)) throw new ForbiddenException('Transición de reserva no permitida');
      previous = booking.status;
      booking.status = status;
      saved = await bookings.save(booking);
      if (status === BookingStatus.CANCELLED) {
        // Liberar el turno es parte de la misma transacción que el estado de
        // la reserva: ante un error, se revierte todo (issue #18).
        await shifts.update({ id: booking.shiftId }, { status: ShiftStatus.AVAILABLE });
      }
    });
    await this.recordEvent(saved.id, user.userId, previous, status);

    if (status === BookingStatus.CONFIRMED) {
      await this.notifications.notifyUser(
        saved.clientUserId,
        saved.organizationId,
        await this.bookingNotification(saved, 'b2b_booking_confirmed', 'success'),
        user.userId,
      );
      await this.sendBookingWhatsApp('client', saved, 'confirmation', 'Reserva confirmada');
    } else if (status === BookingStatus.COMPLETED) {
      await this.notifications.notifyUser(
        saved.clientUserId,
        saved.organizationId,
        await this.bookingNotification(saved, 'b2b_booking_completed', 'success'),
        user.userId,
      );
    } else if (status === BookingStatus.CANCELLED) {
      const notification = await this.bookingNotification(saved, 'b2b_booking_cancelled', 'warning');
      if (isStaff) {
        await this.notifications.notifyUser(saved.clientUserId, saved.organizationId, notification, user.userId);
      } else {
        await this.notifications.notifyStaff(saved.organizationId, notification, user.userId);
      }
    }

    return saved;
  }

  /**
   * Confirma asistencia del cliente al turno (R3): solo dentro de la ventana de
   * 30 minutos previos al inicio. Avísale al complejo por WhatsApp (org con
   * teléfono + opt-in) y devuelve `{ sent }` para que la UI muestre el resultado.
   */
  async confirmAttendance(user: B2bJwtUser, bookingId: string) {
    const isStaff = user.roles.some(isStaffRole);
    const booking = await this.bookings.findOne({ where: { id: bookingId, organizationId: user.organizationId } });
    if (!booking || (!isStaff && booking.clientUserId !== user.userId)) throw new NotFoundException('Reserva no encontrada');
    if ([BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(booking.status)) {
      throw new ConflictException('La reserva ya está cerrada');
    }
    const shift = await this.shifts.findOneBy({ id: booking.shiftId });
    if (!shift) throw new NotFoundException('Turno no encontrado');
    const minutesLeft = Math.round((shift.startsAt.getTime() - Date.now()) / 60000);
    if (minutesLeft < 0) throw new ConflictException('El turno ya comenzó');
    if (minutesLeft > 30) throw new ConflictException('El botón de confirmación se habilita dentro de los 30 minutos previos al turno');

    const organization = await this.organizations.findOneBy({ id: booking.organizationId });
    if (!organization || !canSendWhatsApp(organization.whatsappPhone, organization.whatsappOptIn)) {
      return { sent: false, message: 'El complejo aún no configuró WhatsApp para recibir avisos.' };
    }

    const clientName = await this.notifications.getUserDisplayName(booking.clientUserId);
    const [court, timeZone] = await Promise.all([
      this.courts.findOneBy({ id: booking.courtId }),
      this.organizations.findOneBy({ id: booking.organizationId }).then((org) => resolveTimeZone(org?.timezone)),
    ]);
    const hour = orgTimeString(shift.startsAt, timeZone);
    const date = orgDateString(shift.startsAt, timeZone);
    let delivered = false;
    try {
      const result = await this.messaging.sendWhatsApp(
        organization.whatsappPhone,
        `${clientName} confirmó asistencia al turno de las ${hour} en ${court?.name ?? 'la cancha'} (${date}).`,
        'reminder',
        { bookingId: booking.id },
      );
      delivered = result.delivered;
    } catch (error) {
      this.logger.error(`confirmAttendance ${booking.id}: envío WhatsApp al complejo falló: ${(error as Error)?.message ?? error}`);
    }
    return { sent: delivered, message: delivered ? 'El complejo fue avisado.' : 'No se pudo avisar al complejo por WhatsApp.' };
  }

  /**
   * Envío best-effort de WhatsApp sobre una reserva (R2). Nunca lanza: un fallo
   * de mensajería se registra y el flujo sigue igual (la reserva ya transitó).
   * audience 'client' gatea con el teléfono+opt-in del reservante; 'organization'
   * con los del complejo (aviso de asistencia).
   */
  private async sendBookingWhatsApp(
    audience: 'client' | 'organization',
    booking: B2bBookingEntity,
    kind: MessageKind,
    context: string,
  ) {
    try {
      const [shift, court, organization, clientName] = await Promise.all([
        this.shifts.findOneBy({ id: booking.shiftId }),
        this.courts.findOneBy({ id: booking.courtId }),
        this.organizations.findOneBy({ id: booking.organizationId }),
        this.notifications.getUserDisplayName(booking.clientUserId),
      ]);
      const to = audience === 'client' ? booking.clientUserId : booking.organizationId;
      const recipient = audience === 'client'
        ? await this.users.findOneBy({ id: to })
        : organization;
      const phone = recipient?.whatsappPhone ?? null;
      const optIn = recipient?.whatsappOptIn ?? false;
      if (!canSendWhatsApp(phone, optIn)) return;

      const courtName = court?.name ?? 'la cancha';
      const orgName = organization?.name ?? 'el complejo';
      const timeLabel = this.shiftTimeLabel(shift, organization);
      const body = audience === 'client'
        ? `Tu reserva en ${courtName} del ${timeLabel} fue confirmada por ${orgName}. ${this.summaryLine(booking)}`
        : `${clientName} confirmó asistencia al turno de las ${timeLabel.split(' a las ')[1] ?? timeLabel} en ${courtName} (${orgName}).`;
      await this.messaging.sendWhatsApp(phone, body, kind, { bookingId: booking.id });
    } catch (error) {
      this.logger.error(`sendBookingWhatsApp (${context}, ${booking.id}): ${(error as Error)?.message ?? error}`);
    }
  }

  private shiftTimeLabel(shift: B2bShiftEntity | null | undefined, organization: B2bOrganizationEntity | null | undefined): string {
    if (!shift) return 'sin horario definido';
    const timeZone = resolveTimeZone(organization?.timezone);
    const hour = orgTimeString(shift.startsAt, timeZone);
    const date = orgDateString(shift.startsAt, timeZone);
    return `${date} a las ${hour}`;
  }

  private summaryLine(booking: B2bBookingEntity): string {
    return `Ref: ${booking.id.slice(0, 8).toUpperCase()} · $ ${(booking.priceCentsArs / 100).toLocaleString('es-AR')} ARS`;
  }

  async rescheduleBooking(user: B2bJwtUser, id: string, shiftId: string) {
    const isStaff = user.roles.some(isStaffRole);
    const saved = await this.unitOfWork.execute(async (repositories) => {
      // Transacción con bloqueo de fila: la reserva y el turno de destino se
      // serializan frente a reprogramaciones/cancelaciones concurrentes, y la
      // liberación de un turno y la toma del otro son atómicas (issue #18).
      const bookings = repositories.get(B2bBookingEntity);
      const shifts = repositories.get(B2bShiftEntity);
      const booking = await bookings.findOne({
        where: { id, organizationId: user.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Reserva no encontrada');
      if (!isStaff && booking.clientUserId !== user.userId) throw new ForbiddenException('No puede modificar esta reserva');
      const shift = await shifts.findOne({
        where: { id: shiftId, organizationId: user.organizationId, status: ShiftStatus.AVAILABLE },
        lock: { mode: 'pessimistic_write' },
      });
      if (!shift) throw new ConflictException('El nuevo turno no está disponible');
      await this.assertUnblocked(shift, repositories.get(B2bAvailabilityBlockEntity));
      const previousShiftId = booking.shiftId;
      // El turno nuevo se marca BOOKED antes de liberar el anterior; si algo
      // falla a mitad de proceso la transacción revierte ambos cambios.
      await shifts.update({ id: shift.id }, { status: ShiftStatus.BOOKED });
      await shifts.update({ id: previousShiftId }, { status: ShiftStatus.AVAILABLE });
      booking.shiftId = shift.id;
      booking.courtId = shift.courtId;
      booking.priceCentsArs = shift.priceCentsArs;
      return bookings.save(booking);
    });
    await this.recordEvent(saved.id, user.userId, saved.status, saved.status);
    const notification = await this.bookingNotification(saved, 'b2b_booking_rescheduled', 'info');
    if (isStaff) {
      await this.notifications.notifyUser(saved.clientUserId, saved.organizationId, notification, user.userId);
    } else {
      await this.notifications.notifyStaff(saved.organizationId, notification, user.userId);
    }
    return saved;
  }

  private async assertUnblocked(shift: B2bShiftEntity, blocks: RepositoryPort<B2bAvailabilityBlockEntity> = this.blocks) {
    const found = await blocks.find({ where: { organizationId: shift.organizationId, courtId: shift.courtId } });
    if (found.some((block) => block.startsAt < shift.endsAt && block.endsAt > shift.startsAt)) {
      throw new ConflictException('El turno está bloqueado');
    }
  }

  private async bookingNotification(
    booking: B2bBookingEntity,
    type: 'b2b_booking_pending' | 'b2b_booking_confirmed' | 'b2b_booking_cancelled' | 'b2b_booking_completed' | 'b2b_booking_rescheduled',
    severity: 'info' | 'success' | 'warning',
  ): Promise<B2bNotifyOptions> {
    const [shift, court, organization] = await Promise.all([
      this.shifts.findOneBy({ id: booking.shiftId }),
      this.courts.findOneBy({ id: booking.courtId }),
      this.organizations.findOneBy({ id: booking.organizationId }),
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
      body: `${this.formatShiftTime(shift, resolveTimeZone(organization?.timezone))} • cliente ${clientName}`,
      metadata: {
        bookingId: booking.id,
        courtId: booking.courtId,
        courtName,
        shiftStartsAt: shift?.startsAt.toISOString() ?? null,
        clientUserId: booking.clientUserId,
      },
    };
  }

  private formatShiftTime(shift: B2bShiftEntity | undefined | null, timeZone: string): string {
    if (!shift) return 'sin horario definido';
    return `${orgDateString(shift.startsAt, timeZone)} ${orgTimeString(shift.startsAt, timeZone)}`;
  }

  private async orgTimezone(organizationId: string): Promise<string> {
    const organization = await this.organizations.findOneByOrFail({ id: organizationId });
    return resolveTimeZone(organization.timezone);
  }

  private async recordEvent(bookingId: string, actorUserId: string, fromStatus: string | null, toStatus: string) {
    return this.bookingEvents.save(this.bookingEvents.create({ bookingId, actorUserId, fromStatus, toStatus, metadata: {} }));
  }

  private async assertCourt(user: B2bJwtUser, courtId: string) {
    const court = await this.courts.findOneBy({ id: courtId, organizationId: user.organizationId });
    if (!court || court.status === B2bRecordStatus.INACTIVE) throw new NotFoundException('Cancha no encontrada');
    return court;
  }

  private paymentProofRepository(): RepositoryPort<B2bBookingPaymentProofEntity> {
    if (!this.paymentProofs) throw new Error('El repositorio de comprobantes no está configurado.');
    return this.paymentProofs;
  }

  private getCourt(user: B2bJwtUser, courtId: string) {
    return this.assertCourt(user, courtId);
  }
}
