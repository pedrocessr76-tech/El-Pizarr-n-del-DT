import { ConflictException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { B2bRoleCode, ShiftStatus } from './entities/b2b.enums';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bAvailabilityBlockEntity } from './entities/availability-block.entity';
import { DEFAULT_TIMEZONE, orgDateString, orgTimeToDate } from './time';

// Ejecuta el servicio real con repositorios simulados; no sustituye una prueba PostgreSQL.
describe('Horarios y bloqueos', () => {
  const user = { userId: 'owner', organizationId: 'org', email: 'owner@test.invalid', roles: [B2bRoleCode.OWNER] };
  const organizations = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'org', timezone: DEFAULT_TIMEZONE }) };
  // Los rangos se calculan en la zona de la organización (issue #24), no con la
  // hora local del proceso: el test es estable aunque el servidor cambie de región.
  const mondayFrom = orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 0, minute: 0 }, DEFAULT_TIMEZONE).toISOString();
  const mondayTo = orgTimeToDate({ year: 2030, month: 1, day: 8, hour: 0, minute: 0 }, DEFAULT_TIMEZONE).toISOString();

  function setup() {
    const generated: B2bShiftEntity[] = [];
    const savedBlocks: B2bAvailabilityBlockEntity[] = [];
    const courts = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'court', organizationId: 'org' }),
      find: jest.fn().mockResolvedValue([{ id: 'court', name: 'Cancha', sportType: 'FUTBOL 5', facilityId: 'facility' }]),
    };
    const rules = {
      find: jest.fn().mockResolvedValue([{ weekday: 1, startTime: '10:00', durationHours: 1, priceCentsArs: 10000 }]),
      findOne: jest.fn().mockResolvedValue({ id: 'rule', courtId: 'court' }),
      delete: jest.fn(),
    };
    const shifts = {
      create: jest.fn((row) => ({ id: 'shift', ...row })),
      save: jest.fn(async (rows) => { generated.push(...rows); return rows; }),
      update: jest.fn(async ({ id }: { id: string }, changes: Partial<B2bShiftEntity>) => {
        const shift = generated.find((item) => item.id === id);
        if (shift) Object.assign(shift, changes);
        return { affected: shift ? 1 : 0 };
      }),
      findOne: jest.fn(async () => generated[0] ?? null),
      find: jest.fn(async () => generated),
    };
    const blocks = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => { savedBlocks.push(row); return row; }),
      find: jest.fn(async () => savedBlocks),
    };
    const bookings = { findOne: jest.fn().mockResolvedValue(null), find: jest.fn().mockResolvedValue([]), save: jest.fn(), create: jest.fn() };
    const users = { find: jest.fn().mockResolvedValue([]) };
    const manager = {
        getRepository: jest.fn((entity: { name: string }) => {
          const map: Record<string, unknown> = {
            B2bShiftEntity: shifts,
            B2bAvailabilityBlockEntity: blocks,
            B2bBookingEntity: bookings,
          };
          return (map[entity.name] ?? {}) as never;
        }),
      };
    const unitOfWork = {
      execute: jest.fn(async (work: (session: any) => unknown) => work({ get: (entity: any) => manager.getRepository(entity) })),
    };
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue([]),
      notifyUser: jest.fn().mockResolvedValue([]),
      getUserDisplayName: jest.fn().mockResolvedValue('Cliente Test'),
    };
    const service = new B2bManagementService(
      organizations as never, {} as never, courts as never, rules as never,
      shifts as never, blocks as never, bookings as never, {} as never,
      users as never,
      notifications as never,
      unitOfWork as never,
      { send: jest.fn().mockResolvedValue({ delivered: true, provider: 'log' }) } as never,
    );
    return { service, shifts, rules, blocks, bookings, generated, notifications };
  }

  it('excluye un turno generado después de bloquearlo y rechaza reservarlo', async () => {
    const { service, bookings } = setup();
    const from = mondayFrom;
    const to = mondayTo;
    const [shift] = await service.generateShifts(user, 'court', { from, to });
    expect(shift.status).toBe(ShiftStatus.AVAILABLE);
    expect(await service.availability(user, 'court', from, to)).toHaveLength(1);
    await service.createBlock(user, 'court', {
      startsAt: shift.startsAt.toISOString(), endsAt: shift.endsAt.toISOString(), reason: 'Mantenimiento',
    });
    expect(await service.availability(user, 'court', from, to)).toEqual([]);
    await expect(service.createBooking(user, { courtId: 'court', shiftId: shift.id })).rejects.toThrow(ConflictException);
    expect(bookings.save).not.toHaveBeenCalled();
  });

  it('al regenerar bloquea turnos libres de reglas eliminadas pero conserva reservas', async () => {
    const { service, generated } = setup();
    generated.push(
      {
        id: 'old-free', organizationId: 'org', courtId: 'court',
        startsAt: orgTimeToDate({ year: 2030, month: 1, day: 8, hour: 10, minute: 0 }, DEFAULT_TIMEZONE),
        endsAt: orgTimeToDate({ year: 2030, month: 1, day: 8, hour: 11, minute: 0 }, DEFAULT_TIMEZONE),
        status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
      } as B2bShiftEntity,
      {
        id: 'booked', organizationId: 'org', courtId: 'court',
        startsAt: orgTimeToDate({ year: 2030, month: 1, day: 8, hour: 11, minute: 0 }, DEFAULT_TIMEZONE),
        endsAt: orgTimeToDate({ year: 2030, month: 1, day: 8, hour: 12, minute: 0 }, DEFAULT_TIMEZONE),
        status: ShiftStatus.BOOKED, priceCentsArs: 10000,
      } as B2bShiftEntity,
    );

    await service.generateShifts(user, 'court', {
      from: mondayFrom,
      to: orgTimeToDate({ year: 2030, month: 1, day: 9, hour: 0, minute: 0 }, DEFAULT_TIMEZONE).toISOString(),
    });

    expect(generated.find((shift) => shift.id === 'old-free')?.status).toBe(ShiftStatus.BLOCKED);
    expect(generated.some((shift) => shift.id === 'booked')).toBe(true);
  });

  it('el calendario semanal muestra BLOCKED para los turnos que ya no siguen una regla', async () => {
    const { service, generated } = setup();
    generated.push({
      id: 'stale', organizationId: 'org', courtId: 'court',
      startsAt: orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, DEFAULT_TIMEZONE),
      endsAt: orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 11, minute: 0 }, DEFAULT_TIMEZONE),
      status: ShiftStatus.BLOCKED, priceCentsArs: 10000,
    } as B2bShiftEntity);

    const weekly = await service.weeklyAvailability(user, mondayFrom, mondayTo);

    expect(weekly[0].lanes[0].state).toBe('BLOCKED');
  });

  it('actualiza precio y duración de los turnos libres que coinciden con reglas editadas', async () => {
    const { service, rules, generated } = setup();
    rules.find.mockResolvedValue([{ weekday: 1, startTime: '10:00', durationHours: 2, priceCentsArs: 18000 }] as never);
    generated.push({
      id: 'old-free', organizationId: 'org', courtId: 'court',
      startsAt: orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, DEFAULT_TIMEZONE),
      endsAt: orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 11, minute: 0 }, DEFAULT_TIMEZONE),
      status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
    } as B2bShiftEntity);

    await service.generateShifts(user, 'court', { from: mondayFrom, to: mondayTo });

    expect(generated[0].endsAt).toEqual(orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 12, minute: 0 }, DEFAULT_TIMEZONE));
    expect(generated[0].priceCentsArs).toBe(18000);
  });

  it('vuelve a habilitar una hora bloqueada cuando se agrega la regla otra vez', async () => {
    const { service, generated } = setup();
    generated.push({
      id: 'restored', organizationId: 'org', courtId: 'court',
      startsAt: orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, DEFAULT_TIMEZONE),
      endsAt: orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 11, minute: 0 }, DEFAULT_TIMEZONE),
      status: ShiftStatus.BLOCKED, priceCentsArs: 10000,
    } as B2bShiftEntity);

    await service.generateShifts(user, 'court', { from: mondayFrom, to: mondayTo });

    expect(generated[0].status).toBe(ShiftStatus.AVAILABLE);
  });

  it('genera el mes calendario actual completo usando la zona del complejo', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2030-01-07T15:00:00.000Z'));
    try {
      const { service } = setup();

      const generated = await service.generateMonthlyShifts(user, 'court');

      expect(generated).toHaveLength(4);
      expect(generated.map((shift) => orgDateString(shift.startsAt, DEFAULT_TIMEZONE))).toEqual([
        '07/01/2030', '14/01/2030', '21/01/2030', '28/01/2030',
      ]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('createBooking rechaza directamente un turno bloqueado antes de cualquier escritura', async () => {
    const { service, generated, blocks, bookings, shifts } = setup();
    generated.push({
      id: 'shift', organizationId: 'org', courtId: 'court',
      startsAt: new Date('2030-01-07T13:00:00Z'),
      endsAt: new Date('2030-01-07T14:00:00Z'),
      status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
    } as B2bShiftEntity);
    blocks.find.mockResolvedValue([{
      organizationId: 'org', courtId: 'court',
      startsAt: new Date('2030-01-07T13:30:00Z'),
      endsAt: new Date('2030-01-07T14:30:00Z'),
    } as B2bAvailabilityBlockEntity]);

    await expect(service.createBooking(user, { courtId: 'court', shiftId: 'shift' }))
      .rejects.toThrow(new ConflictException('El turno está bloqueado'));

    expect(blocks.find).toHaveBeenCalledWith({ where: { organizationId: 'org', courtId: 'court' } });
    expect(bookings.create).not.toHaveBeenCalled();
    expect(bookings.save).not.toHaveBeenCalled();
    expect(shifts.save).not.toHaveBeenCalled();
    expect(generated[0].status).toBe(ShiftStatus.AVAILABLE);
  });

  it('un bloqueo contiguo no oculta el turno (intervalos semiabiertos)', async () => {
    const { service } = setup();
    const from = mondayFrom;
    const to = mondayTo;
    const [shift] = await service.generateShifts(user, 'court', { from, to });
    await service.createBlock(user, 'court', {
      startsAt: shift.endsAt.toISOString(),
      endsAt: new Date(shift.endsAt.getTime() + 3600000).toISOString(), reason: 'Contiguo',
    });
    expect(await service.availability(user, 'court', from, to)).toHaveLength(1);
  });

  it('excluye turnos en el pasado de la disponibilidad y rechaza reservarlos', async () => {
    const { service, generated } = setup();
    const pastStart = new Date(Date.now() - 7200000);
    const pastEnd = new Date(Date.now() - 3600000);
    generated.push({
      id: 'past-shift',
      organizationId: 'org',
      courtId: 'court',
      startsAt: pastStart,
      endsAt: pastEnd,
      status: ShiftStatus.AVAILABLE,
      priceCentsArs: 10000,
    } as B2bShiftEntity);

    const from = new Date(Date.now() - 86400000).toISOString();
    const to = new Date(Date.now() + 86400000).toISOString();
    const available = await service.availability(user, 'court', from, to);
    expect(available.some((s) => s.id === 'past-shift')).toBe(false);

    await expect(service.createBooking(user, { courtId: 'court', shiftId: 'past-shift' }))
      .rejects.toThrow(new ConflictException('El turno no está disponible o ya pasó'));
  });
});
