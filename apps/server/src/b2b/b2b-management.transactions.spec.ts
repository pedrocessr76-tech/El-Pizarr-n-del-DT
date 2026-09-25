import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { B2bManagementService } from './b2b-management.service';
import { BookingStatus, B2bRoleCode, ShiftStatus } from './entities/b2b.enums';
import { DEFAULT_TIMEZONE } from './time';

// Issue #18: reservas y reprogramaciones transaccionales con bloqueo de fila.
// Verifica que el service ejecuta las escrituras (reserva + turno) dentro de
// una transacción y que ante un error a mitad de proceso nada de esos efectos
// posteriores (evento/notificación) se ejecuta.
describe('Transaccionalidad de reservas (issue #18)', () => {
  const client = { userId: 'client', organizationId: 'org', email: 'client@test.invalid', roles: [B2bRoleCode.CLIENT] };
  const staff = { userId: 'staff', organizationId: 'org', email: 'staff@test.invalid', roles: [B2bRoleCode.OWNER] };
  const organizations = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'org', timezone: DEFAULT_TIMEZONE }), findOneBy: jest.fn().mockResolvedValue({ id: 'org', timezone: DEFAULT_TIMEZONE }) };

  const shift = (id: string, status: ShiftStatus) => ({
    id, courtId: 'court', organizationId: 'org',
    startsAt: new Date('2030-01-07T13:00:00Z'), endsAt: new Date('2030-01-07T14:00:00Z'),
    status, priceCentsArs: 10000,
  });

  function setup(overrides: { targetStatus?: ShiftStatus; shiftStatus?: ShiftStatus; bookingSaveError?: Error } = {}) {
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue([]),
      notifyUser: jest.fn().mockResolvedValue([]),
      getUserDisplayName: jest.fn().mockResolvedValue('Carlos Cliente'),
    };
    const shifts = {
      findOne: jest.fn(async ({ where }: any) => {
        if (where?.id === 'shift2') {
          // El filtro `status: AVAILABLE` de la query excluye el turno si ya no
          // está disponible (simula el WHERE real, no solo el id).
          return (overrides.targetStatus ?? ShiftStatus.AVAILABLE) === ShiftStatus.AVAILABLE
            ? shift('shift2', ShiftStatus.AVAILABLE)
            : null;
        }
        if (where?.id === 'shift') {
          return shift('shift', overrides.shiftStatus ?? ShiftStatus.AVAILABLE);
        }
        return null;
      }),
      findOneBy: jest.fn(async ({ id }: any) => {
        if (id === 'shift2') return shift('shift2', overrides.targetStatus ?? ShiftStatus.AVAILABLE);
        return shift('shift', overrides.shiftStatus ?? ShiftStatus.AVAILABLE);
      }),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(async (row) => row),
    };
    const blocks = { find: jest.fn().mockResolvedValue([]) };
    const bookings = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(async ({ where }: any) => {
        if (where?.shiftId !== undefined) return null;
        return {
          id: 'booking', organizationId: 'org', courtId: 'court', shiftId: 'shift',
          clientUserId: 'client', status: BookingStatus.CONFIRMED, priceCentsArs: 10000, notes: null,
        };
      }),
      create: jest.fn((row) => ({ id: 'booking', clientUserId: 'client', ...row })),
      save: jest.fn(async (booking) => {
        if (overrides.bookingSaveError) throw overrides.bookingSaveError;
        return booking;
      }),
    };
    const bookingEvents = { create: jest.fn((event) => event), save: jest.fn(async (event) => event) };
    const manager = {
      getRepository: jest.fn((entity: { name: string }) => {
        const repos: Record<string, unknown> = {
          B2bShiftEntity: shifts,
          B2bAvailabilityBlockEntity: blocks,
          B2bBookingEntity: bookings,
        };
        return repos[entity.name] ?? {};
      }),
    };
    const unitOfWork = {
      // Emula UnitOfWork: el callback recibe únicamente repositorios del manager.
      execute: jest.fn(async (work: (session: any) => unknown) => work({ get: (entity: any) => manager.getRepository(entity) })),
    };
    const service = new B2bManagementService(
      organizations as never, {} as never,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'court', organizationId: 'org', name: 'Cancha 1' }) } as never,
      {} as never, shifts as never, blocks as never, bookings as never, bookingEvents as never,
      {} as never,
      notifications as never,
      unitOfWork as never,
      { send: jest.fn().mockResolvedValue({ delivered: true, provider: 'log' }) } as never,
    );
    return { service, notifications, bookings, shifts, unitOfWork, manager };
  }

  it('createBooking ejecuta reserva y turno en una transacción con SELECT FOR UPDATE sobre el turno', async () => {
    const { service, bookings, shifts, unitOfWork } = setup();
    const booking = await service.createBooking(client, { courtId: 'court', shiftId: 'shift' });

    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(shifts.findOne).toHaveBeenCalledWith({
      where: { id: 'shift', courtId: 'court', organizationId: 'org' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(bookings.save).toHaveBeenCalledTimes(1);
    expect(shifts.update).toHaveBeenCalledWith({ id: 'shift' }, { status: ShiftStatus.BOOKED });
    expect(booking.status).toBe(BookingStatus.PENDING);
  });

  it('createBooking rechaza con 409 si la carrera dejó el turno BOOKED (post-lock)', async () => {
    const { service, bookings, notifications } = setup({ shiftStatus: ShiftStatus.BOOKED });

    await expect(service.createBooking(client, { courtId: 'court', shiftId: 'shift' }))
      .rejects.toThrow(ConflictException);
    expect(bookings.save).not.toHaveBeenCalled();
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });

  it('createBooking mapea una violación del índice único (23505) a 409 y no ejecuta efectos', async () => {
    const { service, notifications } = setup({
      bookingSaveError: new QueryFailedError('INSERT INTO b2b_bookings', [], { code: '23505' } as never),
    });

    await expect(service.createBooking(client, { courtId: 'court', shiftId: 'shift' }))
      .rejects.toThrow('El turno ya fue reservado');
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });

  it('createBooking no dispara efectos si la transacción falla a mitad de proceso', async () => {
    const boom = new Error('fallo en el commit simulado');
    const { service, notifications } = setup({ bookingSaveError: boom });

    await expect(service.createBooking(client, { courtId: 'court', shiftId: 'shift' }))
      .rejects.toThrow('fallo en el commit simulado');
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
    expect(notifications.notifyUser).not.toHaveBeenCalled();
  });

  it('rescheduleBooking bloquea la reserva y el turno destino y toma/libera atómicamente', async () => {
    const { service, bookings, shifts, unitOfWork } = setup();
    const saved = await service.rescheduleBooking(staff, 'booking', 'shift2');

    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(bookings.findOne).toHaveBeenCalledWith({
      where: { id: 'booking', organizationId: 'org' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(shifts.findOne).toHaveBeenCalledWith({
      where: { id: 'shift2', organizationId: 'org', status: ShiftStatus.AVAILABLE },
      lock: { mode: 'pessimistic_write' },
    });
    expect(shifts.update).toHaveBeenCalledWith({ id: 'shift2' }, { status: ShiftStatus.BOOKED });
    expect(shifts.update).toHaveBeenCalledWith({ id: 'shift' }, { status: ShiftStatus.AVAILABLE });
    expect(saved.shiftId).toBe('shift2');
  });

  it('rescheduleBooking revierte: si el turno destino falla, no ejecuta efectos posteriores', async () => {
    const { service, shifts, bookings, notifications } = setup({ targetStatus: ShiftStatus.BOOKED });

    await expect(service.rescheduleBooking(staff, 'booking', 'shift2'))
      .rejects.toThrow(ConflictException);
    expect(bookings.save).not.toHaveBeenCalled();
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
    expect(notifications.notifyUser).not.toHaveBeenCalled();
  });

  it('la cancelación libera el turno en la misma transacción que el estado', async () => {
    const { service, bookings, shifts, unitOfWork } = setup();
    const saved = await service.transitionBooking(staff, 'booking', BookingStatus.CANCELLED);

    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(bookings.findOne).toHaveBeenCalledWith({
      where: { id: 'booking', organizationId: 'org' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(shifts.update).toHaveBeenCalledWith({ id: 'shift' }, { status: ShiftStatus.AVAILABLE });
    expect(saved.status).toBe(BookingStatus.CANCELLED);
  });
});
