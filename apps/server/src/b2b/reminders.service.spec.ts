import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getInValues, isInValues, RepositoryFindOptions } from '../persistence/repository.port';
import { BookingStatus, B2bRoleCode } from './entities/b2b.enums';
import { RemindersService } from './reminders.service';

const OWNER = { id: 'u-owner', organizationId: 'org-1', roles: [B2bRoleCode.OWNER] } as any;
const CLIENT_USER = { id: 'u-client', organizationId: 'org-1', roles: [B2bRoleCode.CLIENT] } as any;

const NOW = new Date('2026-03-10T15:00:00.000Z');

function fakeRepo<T extends { id: string }>(rows: T[]) {
  const find = jest.fn(async (options?: RepositoryFindOptions<T>) => {
    const clauses = Array.isArray(options?.where) ? options!.where! : options?.where ? [options.where] : [];
    return rows.filter((row) => clauses.every((clause) =>
      (Object.keys(clause) as Array<keyof T>).every((key) => {
        const expected = clause[key];
        if (isInValues(expected)) return getInValues(expected).includes(row[key] as never);
        return row[key] === expected;
      })));
  });
  return {
    rows,
    find,
    findOneBy: jest.fn(async (where: Partial<T>) => rows.find((row) =>
      (Object.keys(where) as Array<keyof T>).every((key) => row[key] === where[key]))),
    update: jest.fn(async () => undefined),
  };
}

function setup(options: {
  reminders?: any[];
  bookings?: any[];
  shifts?: any[];
  clients?: any[];
  courts?: any[];
} = {}) {
  const reminders = fakeRepo(options.reminders ?? []);
  const bookings = fakeRepo(options.bookings ?? []);
  const shifts = fakeRepo(options.shifts ?? []);
  const clients = fakeRepo(options.clients ?? []);
  const courts = fakeRepo(options.courts ?? []);
  const organizations = fakeRepo([{ id: 'org-1', timezone: 'America/Argentina/Buenos_Aires' }]);

  const service = new RemindersService(reminders as any, bookings as any, shifts as any, courts as any, clients as any, organizations as any);
  return { service, reminders, bookings, shifts, clients, courts, organizations };
}

/** Una reserva activa con turno en `minutesFromNow`, lista para aparecer como aviso. */
function alertFixture(overrides: { minutesFromNow?: number; status?: string; channel?: string } = {}) {
  return {
    reminders: [{
      id: 'rem-1',
      bookingId: 'b1',
      channel: overrides.channel ?? 'whatsapp',
      minutesBefore: 30,
      status: overrides.status ?? 'AWAITING_MANUAL',
    }],
    bookings: [{ id: 'b1', shiftId: 's1', courtId: 'c1', clientUserId: 'cl1', organizationId: 'org-1', status: BookingStatus.CONFIRMED }],
    shifts: [{ id: 's1', startsAt: new Date(NOW.getTime() + (overrides.minutesFromNow ?? 20) * 60_000) }],
    clients: [{ id: 'cl1', fullName: 'Ana Perez', email: 'ana@ejemplo.com', whatsappPhone: '+5491155551234', whatsappOptIn: true }],
    courts: [{ id: 'c1', name: 'Cancha 1' }],
  };
}

describe('RemindersService (#34)', () => {
  describe('listPending', () => {
    it('devuelve el aviso pendiente con el mensaje listo para despachar', async () => {
      const { service } = setup(alertFixture());

      const alerts = await service.listPending(OWNER, NOW);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        reminderId: 'rem-1',
        bookingId: 'b1',
        clientName: 'Ana Perez',
        phone: '+5491155551234',
        courtName: 'Cancha 1',
        minutesBefore: 30,
      });
      expect(alerts[0].body).toContain('Ana Perez');
      expect(alerts[0].body).toContain('Cancha 1');
      expect(alerts[0].timeLabel).toMatch(/\d{2}:\d{2}/);
    });

    it('solo lee avisos de WhatsApp en AWAITING_MANUAL', async () => {
      const { service, reminders } = setup(alertFixture());

      await service.listPending(OWNER, NOW);

      expect(reminders.find).toHaveBeenCalledWith({
        where: { channel: 'whatsapp', status: 'AWAITING_MANUAL' },
      });
    });

    it('ordena por hora de inicio del turno', async () => {
      const { service } = setup({
        reminders: [
          { id: 'r-late', bookingId: 'b2', channel: 'whatsapp', minutesBefore: 30, status: 'AWAITING_MANUAL' },
          { id: 'r-soon', bookingId: 'b1', channel: 'whatsapp', minutesBefore: 30, status: 'AWAITING_MANUAL' },
        ],
        bookings: [
          { id: 'b1', shiftId: 's1', courtId: 'c1', clientUserId: 'cl1', organizationId: 'org-1', status: BookingStatus.CONFIRMED },
          { id: 'b2', shiftId: 's2', courtId: 'c1', clientUserId: 'cl1', organizationId: 'org-1', status: BookingStatus.CONFIRMED },
        ],
        shifts: [
          { id: 's1', startsAt: new Date(NOW.getTime() + 10 * 60_000) },
          { id: 's2', startsAt: new Date(NOW.getTime() + 25 * 60_000) },
        ],
        clients: [{ id: 'cl1', fullName: 'Ana Perez', email: 'ana@ejemplo.com', whatsappPhone: '+5491155551234', whatsappOptIn: true }],
        courts: [{ id: 'c1', name: 'Cancha 1' }],
      });

      const alerts = await service.listPending(OWNER, NOW);

      expect(alerts.map((alert) => alert.bookingId)).toEqual(['b1', 'b2']);
    });

    it('omite el aviso si el turno ya empezó', async () => {
      const { service } = setup(alertFixture({ minutesFromNow: -5 }));

      await expect(service.listPending(OWNER, NOW)).resolves.toEqual([]);
    });

    it('omite el aviso si la reserva ya no está activa', async () => {
      const fixture = alertFixture();
      const { service } = setup({
        ...fixture,
        bookings: fixture.bookings.map((booking) => ({ ...booking, status: BookingStatus.CANCELLED })),
      });

      await expect(service.listPending(OWNER, NOW)).resolves.toEqual([]);
    });

    it('omite el aviso si el cliente ya no puede recibir WhatsApp', async () => {
      const fixture = alertFixture();
      const { service } = setup({
        ...fixture,
        clients: fixture.clients.map((client) => ({ ...client, whatsappOptIn: false })),
      });

      await expect(service.listPending(OWNER, NOW)).resolves.toEqual([]);
    });

    it('no filtra avisos de otro complejo', async () => {
      const fixture = alertFixture();
      const { service } = setup({
        ...fixture,
        bookings: fixture.bookings.map((booking) => ({ ...booking, organizationId: 'org-otro' })),
      });

      await expect(service.listPending(OWNER, NOW)).resolves.toEqual([]);
    });

    it('devuelve vacío sin tocar más repositorios cuando no hay avisos', async () => {
      const { service, bookings } = setup({ reminders: [] });

      await expect(service.listPending(OWNER, NOW)).resolves.toEqual([]);
      expect(bookings.find).not.toHaveBeenCalled();
    });

    it('expone los avisos a admin y operador, pero no al personal sin rol de staff', async () => {
      const fixture = alertFixture();
      const { service } = setup(fixture);

      for (const role of [B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR]) {
        const staff = { organizationId: 'org-1', roles: [role] } as any;
        await expect(service.listPending(staff, NOW)).resolves.toHaveLength(1);
      }
      await expect(service.listPending(CLIENT_USER, NOW)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('markDispatched', () => {
    it('cierra el aviso y lo saca del panel', async () => {
      const { service, reminders } = setup(alertFixture());

      await expect(service.markDispatched(OWNER, 'rem-1')).resolves.toEqual({ dispatched: true });

      expect(reminders.update).toHaveBeenCalledWith(
        { id: 'rem-1' },
        expect.objectContaining({ status: 'SENT', provider: 'manual' }),
      );
    });

    it('rechaza con 404 si el aviso no existe', async () => {
      const { service } = setup(alertFixture());

      await expect(service.markDispatched(OWNER, 'no-existe')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza con 404 si el aviso pertenece a otro complejo', async () => {
      const fixture = alertFixture();
      const { service } = setup({
        ...fixture,
        bookings: fixture.bookings.map((booking) => ({ ...booking, organizationId: 'org-otro' })),
      });

      await expect(service.markDispatched(OWNER, 'rem-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza con 404 si el aviso ya no está pendiente', async () => {
      const { service, reminders } = setup(alertFixture({ status: 'SENT' }));

      await expect(service.markDispatched(OWNER, 'rem-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(reminders.update).not.toHaveBeenCalled();
    });

    it('rechaza con 404 si el recordatorio es de email', async () => {
      const { service, reminders } = setup(alertFixture({ channel: 'email' }));

      await expect(service.markDispatched(OWNER, 'rem-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(reminders.update).not.toHaveBeenCalled();
    });

    it('exige rol de staff', async () => {
      const { service } = setup(alertFixture());

      await expect(service.markDispatched(CLIENT_USER, 'rem-1')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});