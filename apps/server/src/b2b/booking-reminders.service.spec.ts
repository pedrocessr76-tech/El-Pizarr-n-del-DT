import { getBetweenValues, getInValues, isBetweenValues, isInValues, RepositoryFindOptions } from '../persistence/repository.port';
import { BookingStatus } from './entities/b2b.enums';
import { B2bBookingReminderEntity } from './entities/booking-reminder.entity';
import { BookingRemindersService, reminderIntervalsFor } from './booking-reminders.service';

const ORG = {
  id: 'org-1',
  timezone: 'America/Argentina/Buenos_Aires',
  emailReminderIntervalsMinutes: [1440],
  whatsappReminderIntervalsMinutes: [30],
};

const CLIENT = {
  id: 'u1',
  fullName: 'Ana Perez',
  email: 'ana@ejemplo.com',
  whatsappPhone: '+5491155551234',
  whatsappOptIn: true,
};

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

/**
 * Repo de prueba que sí respeta los criterios de `find`, como el adaptador real:
 * si el servicio no filtra por estado o por rango de turnos, el test lo detecta.
 */
function fakeRepo<T extends { id: string }>(rows: T[]) {
  const find = jest.fn(async (options?: RepositoryFindOptions<T>) => {
    const clauses = Array.isArray(options?.where) ? options!.where! : options?.where ? [options.where] : [];
    return rows.filter((row) => clauses.every((clause) => {
      return (Object.keys(clause) as Array<keyof T>).every((key) => {
        const expected = clause[key];
        const actual = row[key];
        if (isInValues(expected)) return getInValues(expected).includes(actual as never);
        if (isBetweenValues(expected)) {
          const [from, to] = getBetweenValues(expected) as [unknown, unknown];
          return (actual as never as number) >= (from as number) && (actual as never as number) <= (to as number);
        }
        return actual === expected;
      });
    }));
  });
  return { rows, find };
}

function baseSetup(options: {
  organizations?: unknown[];
  minutesFromNow?: number;
  client?: unknown;
} = {}) {
  const bookings = fakeRepo([{
    id: 'b1',
    shiftId: 's1',
    courtId: 'c1',
    clientUserId: 'u1',
    organizationId: 'org-1',
    status: options.client === null ? BookingStatus.CANCELLED : BookingStatus.CONFIRMED,
  } as any]);

  const shifts = fakeRepo([{
    id: 's1',
    startsAt: new Date(new Date('2026-03-10T15:00:00.000Z').getTime() + (options.minutesFromNow ?? 1440) * 60_000),
  } as any]);

  const organizations = fakeRepo(
    (options.organizations === undefined ? [ORG] : options.organizations) as any[],
  );

  const users = fakeRepo([options.client === null ? undefined : options.client === undefined ? CLIENT : options.client] as any[]);
  const courts = fakeRepo([{ id: 'c1', name: 'Cancha 1' } as any]);
  const reminders = {
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const saved: any[] = [];
  const unitOfWork = {
    execute: jest.fn(async (work: (repositories: any) => unknown) => work({
      get: () => ({
        findOne: jest.fn().mockResolvedValue(null),
        create: (data: any) => data,
        save: jest.fn(async (reminder: any) => {
          const stored = { id: `rem-${saved.length + 1}`, attempts: 1, updatedAt: new Date(), ...reminder };
          saved.push(stored);
          return stored;
        }),
      }),
    })),
  };

  const messaging = {
    sendEmail: jest.fn().mockResolvedValue({ delivered: true, provider: 'smtp', messageId: 'e1' }),
    sendWhatsApp: jest.fn().mockResolvedValue({ delivered: true, provider: 'log', messageId: null }),
  };

  const service = new BookingRemindersService(
    organizations as any, bookings as any, shifts as any, courts as any, users as any,
    reminders as any, unitOfWork as any, messaging as any,
  );

  return { service, saved, messaging, reminders, bookings, shifts, courts, users, organizations, unitOfWork };
}

describe('reminderIntervalsFor', () => {
  it('devuelve la lista configurada del canal', () => {
    const org = { emailReminderIntervalsMinutes: [1440, 120], whatsappReminderIntervalsMinutes: [30] } as any;
    expect(reminderIntervalsFor(org, 'email')).toEqual([1440, 120]);
    expect(reminderIntervalsFor(org, 'whatsapp')).toEqual([30]);
  });

  it('respeta la lista vacía para desactivar un canal', () => {
    const org = { emailReminderIntervalsMinutes: [], whatsappReminderIntervalsMinutes: [30] } as any;
    expect(reminderIntervalsFor(org, 'email')).toEqual([]);
  });

  it('descarta valores no enteros, no positivos o fuera del máximo', () => {
    const org = { emailReminderIntervalsMinutes: [0, -5, 12.5, 999999], whatsappReminderIntervalsMinutes: [30] } as any;
    expect(reminderIntervalsFor(org, 'email')).toEqual([]);
  });

  it('tolera que la lista no sea un arreglo y cae al default del canal', () => {
    const org = { emailReminderIntervalsMinutes: null, whatsappReminderIntervalsMinutes: undefined } as any;
    expect(reminderIntervalsFor(org, 'email')).toEqual([1440]);
    expect(reminderIntervalsFor(org, 'whatsapp')).toEqual([30]);
  });
});

describe('BookingRemindersService (#34)', () => {
  const now = new Date('2026-03-10T15:00:00.000Z');

  it('envía por email la anticipación de 24 h sin pedir consentimiento adicional', async () => {
    const setup = baseSetup();
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).toHaveBeenCalledTimes(1);
    const [to, body, subject, kind, context] = setup.messaging.sendEmail.mock.calls[0];
    expect(to).toBe('ana@ejemplo.com');
    expect(subject).toContain('Cancha 1');
    expect(kind).toBe('reminder');
    // El cuerpo va con texto y HTML: el texto plano es el respaldo para los
    // clientes que no renderizan HTML.
    expect(body.text).toContain('Ana Perez');
    expect(body.text).toContain('Cancha 1');
    expect(body.html).toContain('Ana Perez');
    expect(body.html).toContain('Cancha 1');
    expect(context).toEqual({ bookingId: 'b1', minutesBefore: 1440 });
  });

  it('envía el email aunque el cliente no haya dado opt-in de WhatsApp', async () => {
    const setup = baseSetup({ client: { ...CLIENT, whatsappOptIn: false, whatsappPhone: null } });
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).toHaveBeenCalledTimes(1);
    expect(setup.saved.filter((r) => r.channel === 'whatsapp')).toHaveLength(0);
  });

  it('deja el aviso de WhatsApp pendiente y no llama al proveedor', async () => {
    const setup = baseSetup({
      minutesFromNow: 30,
      organizations: [{ ...ORG, emailReminderIntervalsMinutes: [], whatsappReminderIntervalsMinutes: [30] }],
    });
    await setup.service.processDueReminders(now);

    expect(setup.saved).toHaveLength(1);
    expect(setup.saved[0]).toMatchObject({ channel: 'whatsapp', minutesBefore: 30, status: 'PROCESSING' });
    expect(setup.reminders.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rem-1' }),
      expect.objectContaining({ status: 'AWAITING_MANUAL' }),
    );
    expect(setup.messaging.sendWhatsApp).not.toHaveBeenCalled();
  });

  it('omite el aviso de WhatsApp sin teléfono o consentimiento', async () => {
    const setup = baseSetup({
      minutesFromNow: 30,
      organizations: [{ ...ORG, emailReminderIntervalsMinutes: [], whatsappReminderIntervalsMinutes: [30] }],
      client: { ...CLIENT, whatsappOptIn: false },
    });
    await setup.service.processDueReminders(now);

    expect(setup.reminders.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'SKIPPED' }),
    );
  });

  it('omite el email si el cliente no tiene email registrado', async () => {
    const setup = baseSetup({ client: { ...CLIENT, email: '' } });
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
    expect(setup.reminders.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'SKIPPED' }),
    );
  });

  it('marca SIMULATED cuando el proveedor de email es log', async () => {
    const setup = baseSetup();
    setup.messaging.sendEmail.mockResolvedValue({ delivered: true, provider: 'log', messageId: null });
    await setup.service.processDueReminders(now);

    expect(setup.reminders.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'SIMULATED', provider: 'log' }),
    );
  });

  it('deja FAILED y reintentable cuando el envío de email falla', async () => {
    const setup = baseSetup();
    setup.messaging.sendEmail.mockRejectedValue(new Error('smtp caído'));
    await setup.service.processDueReminders(now);

    expect(setup.reminders.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'FAILED', lastError: 'smtp caído' }),
    );
  });

  it('marca FAILED si el proveedor no confirma la entrega', async () => {
    const setup = baseSetup();
    setup.messaging.sendEmail.mockResolvedValue({ delivered: false, provider: 'smtp', messageId: null });
    await setup.service.processDueReminders(now);

    expect(setup.reminders.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'FAILED', provider: 'smtp' }),
    );
  });

  it('reintenta un recordatorio FAILED en el ciclo siguiente', async () => {
    const setup = baseSetup();
    setup.messaging.sendEmail.mockRejectedValue(new Error('smtp caído'));
    await setup.service.processDueReminders(now);
    expect(setup.messaging.sendEmail).toHaveBeenCalledTimes(1);

    // El ciclo siguiente vuelve a encontrar el recordatorio en FAILED: es reintentable.
    setup.unitOfWork.execute.mockImplementation(async (work: any) => work({
      get: () => ({
        findOne: jest.fn().mockResolvedValue({ id: 'r1', status: 'FAILED', attempts: 1, updatedAt: new Date(0) }),
        create: (data: any) => data,
        save: jest.fn(async (reminder: any) => reminder),
      }),
    }));
    setup.messaging.sendEmail.mockResolvedValue({ delivered: true, provider: 'smtp', messageId: 'e2' });

    await setup.service.processDueReminders(new Date(now.getTime() + 60_000));

    expect(setup.messaging.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('consulta solo reservas PENDING o CONFIRMED', async () => {
    const setup = baseSetup();
    await setup.service.processDueReminders(now);

    expect(setup.bookings.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: expect.anything() }),
    }));
    const criteria = (setup.bookings.find.mock.calls[0][0] as any).where.status;
    expect(getInValues(criteria).sort()).toEqual([...ACTIVE_STATUSES].sort());
  });

  it('no genera nada si la reserva está cancelada', async () => {
    const setup = baseSetup({ client: null });
    await setup.service.processDueReminders(now);

    expect(setup.bookings.find.mock.results[0].value).toBeDefined();
    expect(setup.saved).toHaveLength(0);
    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
  });

  it('no genera nada si el turno ya empezó', async () => {
    const setup = baseSetup({ minutesFromNow: -10 });
    await setup.service.processDueReminders(now);

    expect(setup.saved).toHaveLength(0);
    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
  });

  it('no envía una anticipación que todavía no venció', async () => {
    const setup = baseSetup({ minutesFromNow: 1500 });
    await setup.service.processDueReminders(now);

    expect(setup.saved).toHaveLength(0);
    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
  });

  it('reclama por reserva, canal y anticipación sin pisarse', async () => {
    const setup = baseSetup({
      minutesFromNow: 30,
      organizations: [{ ...ORG, emailReminderIntervalsMinutes: [30], whatsappReminderIntervalsMinutes: [30] }],
    });
    await setup.service.processDueReminders(now);

    expect(setup.saved.map((r) => `${r.channel}:${r.minutesBefore}`).sort()).toEqual(['email:30', 'whatsapp:30']);
  });

  it('entrega tarde un recordatorio cuyo momento ya pasó en vez de perderlo', async () => {
    const setup = baseSetup({
      minutesFromNow: 30,
      organizations: [{ ...ORG, emailReminderIntervalsMinutes: [1440], whatsappReminderIntervalsMinutes: [] }],
    });
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a reclamar un recordatorio en AWAITING_MANUAL', async () => {
    const setup = baseSetup({ minutesFromNow: 30 });
    setup.unitOfWork.execute.mockImplementation(async (work: any) => work({
      get: () => ({
        findOne: jest.fn().mockResolvedValue({ id: 'r1', status: 'AWAITING_MANUAL', updatedAt: new Date(0) }),
        create: (data: any) => data,
        save: jest.fn(),
      }),
    }));
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
    expect(setup.reminders.update).not.toHaveBeenCalled();
  });

  it('no reintenta un recordatorio ya enviado', async () => {
    const setup = baseSetup();
    setup.unitOfWork.execute.mockImplementation(async (work: any) => work({
      get: () => ({
        findOne: jest.fn().mockResolvedValue({ id: 'r1', status: 'SENT', updatedAt: new Date(0) }),
        create: (data: any) => data,
        save: jest.fn(),
      }),
    }));
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
  });

  it('no reintenta un recordatorio tomado por otro ciclo todavía en vuelo', async () => {
    const setup = baseSetup();
    setup.unitOfWork.execute.mockImplementation(async (work: any) => work({
      get: () => ({
        findOne: jest.fn().mockResolvedValue({ id: 'r1', status: 'PROCESSING', updatedAt: new Date(now.getTime()) }),
        create: (data: any) => data,
        save: jest.fn(),
      }),
    }));
    await setup.service.processDueReminders(now);

    expect(setup.messaging.sendEmail).not.toHaveBeenCalled();
  });

  it('absorbe un error global sin romper el ciclo', async () => {
    const setup = baseSetup();
    setup.organizations.find.mockRejectedValue(new Error('db caída'));

    await expect(setup.service.processDueReminders(now)).resolves.toBeUndefined();
  });
});