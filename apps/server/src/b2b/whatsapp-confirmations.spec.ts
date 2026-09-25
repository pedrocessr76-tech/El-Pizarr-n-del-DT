import { ConflictException, NotFoundException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { BookingStatus, B2bRoleCode, ShiftStatus } from './entities/b2b.enums';
import { DEFAULT_TIMEZONE } from './time';

// Confirmaciones por WhatsApp (#34): la confirmación del staff avisa al cliente
// (R2) y el botón de asistencia a ≤30 min avisa al complejo (R3). Los envíos son
// best-effort y gatean con canSendWhatsApp (teléfono + opt-in).
describe('Confirmaciones por WhatsApp (R2 confirmación · R3 asistencia)', () => {
  const staff = { userId: 'staff', organizationId: 'org', email: 'staff@test.invalid', roles: [B2bRoleCode.OWNER] };
  const client = { userId: 'client', organizationId: 'org', email: 'client@test.invalid', roles: [B2bRoleCode.CLIENT] };

  function setup(overrides: {
    clientPhone?: string | null;
    clientOptIn?: boolean;
    orgPhone?: string | null;
    orgOptIn?: boolean;
    shiftStart?: Date;
    bookingStatus?: BookingStatus;
    sendRejects?: boolean;
  } = {}) {
    const {
      clientPhone = '+5491112345678',
      clientOptIn = true,
      orgPhone = '+5491199999999',
      orgOptIn = true,
      shiftStart = new Date(Date.now() + 10 * 60000),
      bookingStatus = BookingStatus.PENDING,
      sendRejects = false,
    } = overrides;

    const clientUser = { id: 'client', organizationId: 'org', email: 'client@test.invalid', fullName: 'Carlos Cliente', whatsappPhone: clientPhone, whatsappOptIn: clientOptIn };
    const organization = { id: 'org', name: 'Complejo Test', slug: 'complejo-test', timezone: DEFAULT_TIMEZONE, whatsappPhone: orgPhone, whatsappOptIn: orgOptIn };

    const notifications = { notifyStaff: jest.fn().mockResolvedValue([]), notifyUser: jest.fn().mockResolvedValue([]), getUserDisplayName: jest.fn().mockResolvedValue('Carlos Cliente') };
    const courts = { findOneBy: jest.fn().mockResolvedValue({ id: 'court', organizationId: 'org', name: 'Cancha 1' }) };
    const organizations = {
      findOneBy: jest.fn().mockResolvedValue(organization),
      findOneByOrFail: jest.fn().mockResolvedValue(organization),
    };
    const shifts = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'shift', courtId: 'court', organizationId: 'org',
        startsAt: shiftStart, endsAt: new Date(shiftStart.getTime() + 60 * 60000),
        status: ShiftStatus.BOOKED, priceCentsArs: 10000,
      }),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(async (shift: any) => ({ ...shift })),
    };
    const bookings = {
      findOne: jest.fn(async ({ where }: { where: any }) => {
        return {
          id: 'booking', organizationId: 'org', courtId: 'court', shiftId: 'shift',
          clientUserId: 'client', status: where.status ?? bookingStatus, priceCentsArs: 10000, notes: null,
          createdAt: new Date(), updatedAt: new Date(),
        };
      }),
      save: jest.fn(async (booking: any) => booking),
    };
    const bookingEvents = { create: jest.fn((event: any) => event), save: jest.fn(async (event: any) => event) };
    const users = { findOneBy: jest.fn().mockResolvedValue(clientUser) };
    const messaging = { send: jest.fn().mockImplementation(sendRejects ? jest.fn().mockRejectedValue(new Error('provider down')) : jest.fn().mockResolvedValue({ delivered: true, provider: 'log', messageId: 'm1' })) };
    const unitOfWork = {
      execute: jest.fn(async (work: (session: any) => unknown) => work({
        get: jest.fn(() => ({ findOne: bookings.findOne, save: bookings.save, update: shifts.update })),
      })),
    };

    const service = new B2bManagementService(
      organizations as never, {} as never, courts as never, {} as never,
      shifts as never, {} as never, bookings as never, bookingEvents as never,
      users as never,
      notifications as never,
      unitOfWork as never,
      messaging as never,
    );
    return { service, messaging, organizations, users };
  }

  describe('R2 · confirmar la reserva avisa al cliente por WhatsApp', () => {
    it('envía al teléfono del cliente (con opt-in) al confirmar', async () => {
      const { service, messaging } = setup();
      await service.transitionBooking(staff, 'booking', BookingStatus.CONFIRMED);

      expect(messaging.send).toHaveBeenCalledTimes(1);
      const [to, body, kind] = messaging.send.mock.calls[0];
      expect(to).toBe('+5491112345678');
      expect(kind).toBe('confirmation');
      expect(body).toContain('fue confirmada');
      expect(body).toContain('Cancha 1');
    });

    it('no envía si el cliente no tiene opt-in', async () => {
      const { service, messaging } = setup({ clientOptIn: false });
      await service.transitionBooking(staff, 'booking', BookingStatus.CONFIRMED);
      expect(messaging.send).not.toHaveBeenCalled();
    });

    it('no envía si el cliente no cargó teléfono', async () => {
      const { service, messaging } = setup({ clientPhone: null });
      await service.transitionBooking(staff, 'booking', BookingStatus.CONFIRMED);
      expect(messaging.send).not.toHaveBeenCalled();
    });

    it('un fallo del proveedor no rompe la confirmación (best-effort)', async () => {
      const { service } = setup({ sendRejects: true });
      const result = await service.transitionBooking(staff, 'booking', BookingStatus.CONFIRMED);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('R3 · botón de asistencia dentro de la ventana de 30 minutos', () => {
    it('envía al complejo y responde sent:true cuando aplica', async () => {
      const { service, messaging } = setup({ shiftStart: new Date(Date.now() + 10 * 60000) });
      const result = await service.confirmAttendance(client, 'booking');

      expect(result.sent).toBe(true);
      expect(messaging.send).toHaveBeenCalledTimes(1);
      const [to, body, kind] = messaging.send.mock.calls[0];
      expect(to).toBe('+5491199999999');
      expect(kind).toBe('reminder');
      expect(body).toContain('confirmó asistencia');
    });

    it('rechaza con 409 si faltan más de 30 minutos', async () => {
      const { service, messaging } = setup({ shiftStart: new Date(Date.now() + 40 * 60000) });
      await expect(service.confirmAttendance(client, 'booking')).rejects.toBeInstanceOf(ConflictException);
      expect(messaging.send).not.toHaveBeenCalled();
    });

    it('rechaza con 409 si el turno ya comenzó', async () => {
      const { service, messaging } = setup({ shiftStart: new Date(Date.now() - 5 * 60000) });
      await expect(service.confirmAttendance(client, 'booking')).rejects.toBeInstanceOf(ConflictException);
      expect(messaging.send).not.toHaveBeenCalled();
    });

    it('rechaza con 409 una reserva en estado terminal', async () => {
      const { service, messaging } = setup({ bookingStatus: BookingStatus.CANCELLED });
      await expect(service.confirmAttendance(client, 'booking')).rejects.toBeInstanceOf(ConflictException);
      expect(messaging.send).not.toHaveBeenCalled();
    });

    it('rechaza con 404 si la reserva no existe', async () => {
      const { service } = setup();
      service['bookings'].findOne = jest.fn().mockResolvedValue(null);
      await expect(service.confirmAttendance(client, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('responde sent:false si el complejo no configuró WhatsApp', async () => {
      const { service, messaging } = setup({ orgPhone: null });
      const result = await service.confirmAttendance(client, 'booking');
      expect(result.sent).toBe(false);
      expect(messaging.send).not.toHaveBeenCalled();
    });
  });
});
