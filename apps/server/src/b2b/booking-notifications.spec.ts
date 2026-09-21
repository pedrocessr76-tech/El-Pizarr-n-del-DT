import { ConflictException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { BookingStatus, B2bRoleCode, ShiftStatus } from './entities/b2b.enums';

// Emisión de notificaciones desde el ciclo de reservas: cada transición avisa
// al destinatario correcto y el actor no recibe su propio evento.
describe('Notificaciones del ciclo de reservas', () => {
  const client = { userId: 'client', organizationId: 'org', email: 'client@test.invalid', roles: [B2bRoleCode.CLIENT] };
  const staff = { userId: 'staff', organizationId: 'org', email: 'staff@test.invalid', roles: [B2bRoleCode.OWNER] };

  function setup(overrides: { initialStatus?: BookingStatus } = {}) {
    const status = { value: overrides.initialStatus ?? BookingStatus.PENDING };
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue([]),
      notifyUser: jest.fn().mockResolvedValue([]),
      getUserDisplayName: jest.fn().mockResolvedValue('Carlos Cliente'),
    };
    const court = { id: 'court', organizationId: 'org', name: 'Cancha 1' };
    const courts = { findOneBy: jest.fn().mockResolvedValue(court) };
    const shifts = {
      findOneBy: jest.fn(async ({ id }) => {
        if (id === 'shift2') {
          return {
            id: 'shift2', courtId: 'court', organizationId: 'org',
            startsAt: new Date('2030-02-02T15:00:00Z'), endsAt: new Date('2030-02-02T16:00:00Z'),
            status: ShiftStatus.AVAILABLE, priceCentsArs: 12000,
          };
        }
        return {
          id: 'shift', courtId: 'court', organizationId: 'org',
          startsAt: new Date('2030-01-07T13:00:00Z'), endsAt: new Date('2030-01-07T14:00:00Z'),
          status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
        };
      }),
      findOne: jest.fn(async ({ where }) => {
        if (where?.id === 'shift2') {
          return {
            id: 'shift2', courtId: 'court', organizationId: 'org',
            startsAt: new Date('2030-02-02T15:00:00Z'), endsAt: new Date('2030-02-02T16:00:00Z'),
            status: ShiftStatus.AVAILABLE, priceCentsArs: 12000,
          };
        }
        if (where?.id === 'shift') {
          return {
            id: 'shift', courtId: 'court', organizationId: 'org',
            startsAt: new Date('2030-01-07T13:00:00Z'), endsAt: new Date('2030-01-07T14:00:00Z'),
            status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
          };
        }
        return null;
      }),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(async (shift) => ({ ...shift })),
    };
    const blocks = { find: jest.fn().mockResolvedValue([]) };
    const bookings = {
      findOne: jest.fn(async ({ where }) => {
        if (where?.shiftId) return null;
        return {
          id: 'booking', organizationId: 'org', courtId: 'court', shiftId: 'shift',
          clientUserId: 'client', status: status.value, priceCentsArs: 10000, notes: null,
        };
      }),
      create: jest.fn((row) => ({ id: 'booking', clientUserId: 'client', ...row, createdAt: new Date() })),
      save: jest.fn(async (booking) => booking),
    };
    const bookingEvents = { create: jest.fn((event) => event), save: jest.fn(async (event) => event) };
    const service = new B2bManagementService(
      {} as never, {} as never, courts as never, {} as never,
      shifts as never, blocks as never, bookings as never, bookingEvents as never,
      notifications as never,
    );
    return { service, notifications, bookings, shifts, status };
  }

  it('createBooking del cliente avisa al staff del complejo (PENDING)', async () => {
    const { service, notifications } = setup();
    const booking = await service.createBooking(client, { courtId: 'court', shiftId: 'shift' });

    expect(booking.status).toBe(BookingStatus.PENDING);
    expect(notifications.notifyStaff).toHaveBeenCalledTimes(1);
    const [orgId, opts, actor] = notifications.notifyStaff.mock.calls[0];
    expect(orgId).toBe('org');
    expect(actor).toBe('client');
    expect(opts.type).toBe('b2b_booking_pending');
    expect(opts.severity).toBe('info');
    expect(opts.title).toContain('Cancha 1');
    expect(opts.metadata.bookingId).toBe('booking');
    expect(opts.metadata.shiftStartsAt).toBeDefined();
  });

  it('staff confirma la reserva y el cliente recibe b2b_booking_confirmed', async () => {
    const { service, notifications } = setup();
    await service.transitionBooking(staff, 'booking', BookingStatus.CONFIRMED);

    expect(notifications.notifyUser).toHaveBeenCalledTimes(1);
    const [userId, orgId, opts, actor] = notifications.notifyUser.mock.calls[0];
    expect(userId).toBe('client');
    expect(orgId).toBe('org');
    expect(actor).toBe('staff');
    expect(opts.type).toBe('b2b_booking_confirmed');
    expect(opts.severity).toBe('success');
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });

  it('staff completa la reserva y el cliente recibe b2b_booking_completed', async () => {
    const { service, notifications } = setup();
    await service.transitionBooking(staff, 'booking', BookingStatus.COMPLETED);

    expect(notifications.notifyUser).toHaveBeenCalledTimes(1);
    expect(notifications.notifyUser.mock.calls[0][2].type).toBe('b2b_booking_completed');
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });

  it('staff cancela la reserva y el cliente recibe b2b_booking_cancelled', async () => {
    const { service, notifications } = setup();
    await service.transitionBooking(staff, 'booking', BookingStatus.CANCELLED);

    expect(notifications.notifyUser).toHaveBeenCalledTimes(1);
    expect(notifications.notifyUser.mock.calls[0][2].type).toBe('b2b_booking_cancelled');
    expect(notifications.notifyUser.mock.calls[0][2].severity).toBe('warning');
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });

  it('cliente cancela su propia reserva y el staff es avisado (sin auto-notificación)', async () => {
    const { service, notifications } = setup();
    await service.transitionBooking(client, 'booking', BookingStatus.CANCELLED);

    expect(notifications.notifyStaff).toHaveBeenCalledTimes(1);
    const [orgId, opts, actor] = notifications.notifyStaff.mock.calls[0];
    expect(orgId).toBe('org');
    expect(actor).toBe('client');
    expect(opts.type).toBe('b2b_booking_cancelled');
    expect(notifications.notifyUser).not.toHaveBeenCalled();
  });

  it('staff reprograma la reserva y el cliente recibe b2b_booking_rescheduled', async () => {
    const { service, notifications } = setup({ initialStatus: BookingStatus.CONFIRMED });
    await service.rescheduleBooking(staff, 'booking', 'shift2');

    expect(notifications.notifyUser).toHaveBeenCalledTimes(1);
    const [userId, , opts, actor] = notifications.notifyUser.mock.calls[0];
    expect(userId).toBe('client');
    expect(actor).toBe('staff');
    expect(opts.type).toBe('b2b_booking_rescheduled');
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });

  it('cliente reprograma su reserva y el staff del complejo es avisado', async () => {
    const { service, notifications } = setup({ initialStatus: BookingStatus.CONFIRMED });
    await service.rescheduleBooking(client, 'booking', 'shift2');

    expect(notifications.notifyStaff).toHaveBeenCalledTimes(1);
    const [orgId, opts, actor] = notifications.notifyStaff.mock.calls[0];
    expect(orgId).toBe('org');
    expect(actor).toBe('client');
    expect(opts.type).toBe('b2b_booking_rescheduled');
    expect(notifications.notifyUser).not.toHaveBeenCalled();
  });

  it('una reserva sobre un turno no disponible sigue rechazandose sin notificar', async () => {
    const busyBlocks = { find: jest.fn().mockResolvedValue([{ startsAt: new Date('2030-01-07T12:30:00Z'), endsAt: new Date('2030-01-07T13:30:00Z') }]) };
    const shifts = {
      findOne: jest.fn().mockResolvedValue({
        id: 'shift', courtId: 'court', organizationId: 'org',
        startsAt: new Date('2030-01-07T13:00:00Z'), endsAt: new Date('2030-01-07T14:00:00Z'),
        status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
      }),
      findOneBy: jest.fn().mockResolvedValue({
        id: 'shift', courtId: 'court', organizationId: 'org',
        startsAt: new Date('2030-01-07T13:00:00Z'), endsAt: new Date('2030-01-07T14:00:00Z'),
        status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
      }),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(async (shift) => shift),
    };
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue([]),
      notifyUser: jest.fn().mockResolvedValue([]),
      getUserDisplayName: jest.fn().mockResolvedValue('Carlos Cliente'),
    };
    const service = new B2bManagementService(
      {} as never, {} as never,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'court', organizationId: 'org', name: 'Cancha 1' }) } as never,
      {} as never, shifts as never, busyBlocks as never,
      { findOne: jest.fn().mockResolvedValue(null), create: jest.fn(), save: jest.fn() } as never,
      { save: jest.fn() } as never,
      notifications as never,
    );

    await expect(service.createBooking(client, { courtId: 'court', shiftId: 'shift' }))
      .rejects.toThrow(ConflictException);
    expect(notifications.notifyStaff).not.toHaveBeenCalled();
  });
});