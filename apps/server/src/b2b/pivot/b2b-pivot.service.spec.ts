import { BadRequestException, NotFoundException } from '@nestjs/common';
import { B2bRoleCode } from '../entities/b2b.enums';
import { B2bPivotService } from './b2b-pivot.service';

type StoredUser = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  pivotAvailable?: boolean;
  pivotRole?: string;
  pivotPositions?: string[];
  whatsappPhone?: string | null;
  whatsappOptIn?: boolean;
};

const ME: StoredUser = {
  id: 'me',
  organizationId: 'org-1',
  fullName: 'Ana Cliente',
  email: 'ana@test.invalid',
  pivotAvailable: false,
  pivotRole: 'FIELD',
  pivotPositions: [],
  whatsappPhone: '+5491100000001',
  whatsappOptIn: true,
};

function stored(overrides: Partial<StoredUser> & { id: string }): StoredUser {
  return {
    organizationId: 'org-1',
    fullName: `Jugador ${overrides.id}`,
    email: `${overrides.id}@test.invalid`,
    pivotAvailable: true,
    pivotRole: 'FIELD',
    pivotPositions: ['MC'],
    whatsappPhone: null,
    whatsappOptIn: false,
    ...overrides,
  };
}

/**
 * Pivotes del Sistema Canchas: reglas del perfil (rol vs. posiciones), directorio
 * filtrado por disponibilidad y posición, y solicitud de contacto como
 * notificación persistida con WhatsApp condicional al opt-in del destinatario.
 */
describe('B2bPivotService', () => {
  const actor = { userId: 'me', organizationId: 'org-1', email: ME.email, roles: [B2bRoleCode.CLIENT] };

  function setup(accounts: StoredUser[]) {
    const rows = new Map(accounts.map((account) => [account.id, account]));
    const requestRows: Array<Record<string, any>> = [];
    const messageRows: Array<Record<string, any>> = [];
    const users = {
      findOne: jest.fn(async ({ where }: { where: { id: string; pivotAvailable?: boolean } }) => {
        const row = rows.get(where.id);
        if (!row) return null;
        if (where.pivotAvailable !== undefined && (row.pivotAvailable ?? false) !== where.pivotAvailable) return null;
        return row;
      }),
      find: jest.fn(async ({ where }: { where?: { pivotAvailable?: boolean; organizationId?: string } } = {}) =>
        accounts.filter((account) => {
          if (where?.pivotAvailable !== undefined && (account.pivotAvailable ?? false) !== where.pivotAvailable) return false;
          if (where?.organizationId && account.organizationId !== where.organizationId) return false;
          return true;
        }),
      ),
      save: jest.fn(async (row: StoredUser) => {
        rows.set(row.id, row);
        return row;
      }),
    };
    const notifications = { notifyUser: jest.fn().mockResolvedValue({ payloads: [], saved: [] }) };
    const requests = {
      create: jest.fn((input) => ({ id: `request-${requestRows.length + 1}`, createdAt: new Date(), lastMessageAt: new Date(), ...input })),
      save: jest.fn(async (request) => {
        const index = requestRows.findIndex((item) => item.id === request.id);
        if (index === -1) requestRows.push(request);
        else requestRows[index] = request;
        return request;
      }),
      find: jest.fn(async ({ where }: any) => requestRows.filter((item) => {
        const matches = (criteria: Record<string, unknown>) => Object.entries(criteria).every(([key, value]) => item[key] === value);
        return Array.isArray(where) ? where.some(matches) : matches(where);
      })),
      findOne: jest.fn(async ({ where }: any) => requestRows.find((item) => where.some((criteria: any) =>
        Object.entries(criteria).every(([key, value]) => item[key] === value),
      )) ?? null),
    };
    const messages = {
      create: jest.fn((input) => ({ id: `message-${messageRows.length + 1}`, createdAt: new Date(), ...input })),
      save: jest.fn(async (message) => { messageRows.push(message); return message; }),
      find: jest.fn(async () => messageRows),
    };
    const bookingRow = {
      id: 'booking-1', organizationId: 'org-1', clientUserId: 'me', courtId: 'court-1', shiftId: 'shift-1',
      status: 'CONFIRMED', priceCentsArs: 15000,
    };
    const shiftRow = { id: 'shift-1', courtId: 'court-1', organizationId: 'org-1', startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 90000000) };
    const courtRow = { id: 'court-1', organizationId: 'org-1', name: 'Cancha Norte', sportType: 'FUTBOL 5' };
    const bookings = {
      findOne: jest.fn(async ({ where }: any) =>
        where.id === bookingRow.id &&
        (where.organizationId === undefined || where.organizationId === bookingRow.organizationId) &&
        (where.clientUserId === undefined || where.clientUserId === bookingRow.clientUserId)
          ? bookingRow
          : null),
      find: jest.fn(async () => [bookingRow]),
    };
    const shifts = { findOne: jest.fn(async () => shiftRow), find: jest.fn(async () => [shiftRow]) };
    const courts = { findOne: jest.fn(async () => courtRow), find: jest.fn(async () => [courtRow]) };
    const organizations = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'org-1', timezone: 'America/Argentina/Buenos_Aires' }) };
    const gateway = { emitPivotChatMessage: jest.fn(), emitPivotRequestUpdated: jest.fn() };
    const messaging = { sendEmail: jest.fn().mockResolvedValue({ delivered: true, provider: 'smtp', messageId: 'mail-1' }) };
    const service = new B2bPivotService(users as never, requests as never, messages as never, bookings as never, shifts as never, courts as never, organizations as never, notifications as never, gateway as never, messaging as never);
    return { service, users, notifications, requests, messages, messageRows, bookings, shifts, courts, organizations, gateway, messaging };
  }

  describe('getMyProfile', () => {
    it('devuelve los valores por defecto cuando el perfil nunca se configuró', async () => {
      const { service } = setup([{ ...ME, pivotAvailable: undefined, pivotRole: undefined, pivotPositions: undefined }]);

      await expect(service.getMyProfile(actor)).resolves.toEqual({
        userId: 'me',
        fullName: 'Ana Cliente',
        email: ME.email,
        available: false,
        role: 'FIELD',
        positions: [],
        whatsappPhone: '+5491100000001',
        whatsappOptIn: true,
      });
    });

    it('falla si la cuenta no existe', async () => {
      const { service } = setup([]);

      await expect(service.getMyProfile(actor)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateMyProfile', () => {
    it('persiste el perfil y deduplica las posiciones', async () => {
      const { service, users } = setup([{ ...ME }]);

      const saved = await service.updateMyProfile(actor, { available: true, role: 'FIELD', positions: ['MC', 'MC', 'MD'] });

      expect(saved).toEqual(expect.objectContaining({ available: true, role: 'FIELD', positions: ['MC', 'MD'] }));
      expect(users.save).toHaveBeenCalledTimes(1);
    });

    it('rechaza un rol o una posición fuera del catálogo', async () => {
      const { service, users } = setup([{ ...ME }]);

      await expect(service.updateMyProfile(actor, { role: 'DELANTERO' })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.updateMyProfile(actor, { positions: ['ZZZ'] })).rejects.toBeInstanceOf(BadRequestException);
      expect(users.save).not.toHaveBeenCalled();
    });

    it('exige coherencia entre rol y POR', async () => {
      const { service } = setup([{ ...ME }]);

      await expect(service.updateMyProfile(actor, { role: 'GOALKEEPER', positions: ['MC'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.updateMyProfile(actor, { role: 'FIELD', positions: ['POR'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('exige al menos una posición para ofrecerse disponible', async () => {
      const { service, users } = setup([{ ...ME }]);

      await expect(service.updateMyProfile(actor, { available: true, positions: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(users.save).not.toHaveBeenCalled();
    });
  });

  describe('listAvailable', () => {
    it('filtra por posición y excluye al propio usuario y a los no disponibles', async () => {
      const { service } = setup([
        { ...ME },
        stored({ id: 'p1', fullName: 'Bruno', pivotPositions: ['MD'] }),
        stored({ id: 'p2', fullName: 'Carla', pivotPositions: ['MC'] }),
        stored({ id: 'p3', fullName: 'Diego', pivotAvailable: false }),
      ]);

      const players = await service.listAvailable(actor, 'MD');

      expect(players.map((player) => player.userId)).toEqual(['p1']);
      expect(players[0]).toEqual(
        expect.objectContaining({ fullName: 'Bruno', role: 'FIELD', positions: ['MD'], organizationId: 'org-1' }),
      );
    });

    it('incluye a los arqueros cuando se busca POR', async () => {
      const { service, users } = setup([
        { ...ME },
        stored({ id: 'keeper', pivotRole: 'GOALKEEPER', pivotPositions: ['POR'] }),
        stored({ id: 'both', pivotRole: 'BOTH', pivotPositions: ['POR', 'DC'] }),
        stored({ id: 'field', pivotRole: 'FIELD', pivotPositions: ['MC'] }),
      ]);

      const players = await service.listAvailable(actor, 'POR');

      expect(users.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { pivotAvailable: true }, order: { fullName: 'ASC' } }),
      );
      expect(players.map((player) => player.userId).sort()).toEqual(['both', 'keeper']);
    });

    it('acota el directorio a la organización pedida', async () => {
      const { service, users } = setup([
        { ...ME },
        stored({ id: 'same' }),
        stored({ id: 'otro', organizationId: 'org-2' }),
      ]);

      const players = await service.listAvailable(actor, undefined, 'org-2');

      expect(users.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { pivotAvailable: true, organizationId: 'org-2' } }),
      );
      expect(players.map((player) => player.userId)).toEqual(['otro']);
    });

    it('rechaza una posición inválida en el filtro', async () => {
      const { service } = setup([{ ...ME }]);

      await expect(service.listAvailable(actor, 'ZZZ')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('no expone email ni teléfono de los jugadores en el directorio', async () => {
      const { service } = setup([
        { ...ME },
        stored({ id: 'optin', whatsappPhone: '+5491100000009', whatsappOptIn: true }),
        stored({ id: 'nooptin', whatsappPhone: '+5491100000008', whatsappOptIn: false }),
      ]);

      const players = await service.listAvailable(actor);

      expect(players.find((player) => player.userId === 'optin')).not.toHaveProperty('email');
      expect(players.find((player) => player.userId === 'optin')).not.toHaveProperty('whatsappPhone');
      expect(players.find((player) => player.userId === 'nooptin')).not.toHaveProperty('whatsappPhone');
    });
  });

  describe('contact', () => {
    it('guarda una solicitud anónima, notifica a ambas cuentas y envía email al pivote', async () => {
      const { service, notifications, messaging, messageRows } = setup([
        { ...ME },
        stored({ id: 'keeper', fullName: 'Bruno', whatsappPhone: '+5491100000009', whatsappOptIn: true }),
      ]);

      const result = await service.contact(actor, 'keeper', 'booking-1', '  Necesitamos arquero  ');

      expect(result).toEqual({ sent: true, conversationId: 'request-1' });
      expect(messageRows[0].body).toBe('Necesitamos arquero');
      expect(notifications.notifyUser).toHaveBeenCalledWith(
        'keeper',
        'org-1',
        expect.objectContaining({
          type: 'pivot_contact_request',
          severity: 'info',
          metadata: { conversationId: 'request-1' },
        }),
        'me',
      );
      expect(notifications.notifyUser.mock.calls[0][2].body).toContain('Necesitamos arquero');
      expect(notifications.notifyUser.mock.calls[0][2].body).toContain('Cancha Norte');
      expect(JSON.stringify(notifications.notifyUser.mock.calls[0][2].metadata)).not.toContain(ME.email);
      expect(notifications.notifyUser).toHaveBeenCalledWith('me', 'org-1', expect.objectContaining({ title: 'Solicitud enviada' }), 'keeper');
      expect(messaging.sendEmail).toHaveBeenCalledWith(
        'keeper@test.invalid',
        expect.objectContaining({ text: expect.stringContaining('Cancha Norte') }),
        'Nueva solicitud de jugador pivote',
        'generic',
        { conversationId: 'request-1' },
      );
    });

    it('crea la conversación aunque no se envíe una nota inicial', async () => {
      const { service, messageRows } = setup([{ ...ME }, stored({ id: 'keeper' })]);

      await expect(service.contact(actor, 'keeper', 'booking-1')).resolves.toEqual({ sent: true, conversationId: 'request-1' });
      expect(messageRows).toHaveLength(0);
    });

    it('rechaza solicitudes sin reserva propia activa o con turno pasado', async () => {
      const missingBooking = setup([{ ...ME }, stored({ id: 'keeper' })]);
      missingBooking.bookings.findOne.mockResolvedValue(null);
      await expect(missingBooking.service.contact(actor, 'keeper', 'booking-ajena')).rejects.toThrow(/reserva activa propia/);

      const pastShift = setup([{ ...ME }, stored({ id: 'keeper' })]);
      pastShift.shifts.findOne.mockResolvedValue({ id: 'shift-1', startsAt: new Date(Date.now() - 1000) } as never);
      await expect(pastShift.service.contact(actor, 'keeper', 'booking-1')).rejects.toThrow(/turno futuro/);
    });

    it('evita solicitar dos veces al mismo pivote para la misma reserva', async () => {
      const { service, requests } = setup([{ ...ME }, stored({ id: 'keeper' })]);
      requests.findOne.mockResolvedValueOnce({ id: 'previous-request', bookingId: 'booking-1' } as never);

      await expect(service.contact(actor, 'keeper', 'booking-1')).rejects.toThrow(/Ya solicitaste/);
    });

    it('rechaza contactarse a uno mismo o a un pivote que ya no está disponible', async () => {
      const { service } = setup([{ ...ME }, stored({ id: 'off', pivotAvailable: false })]);

      await expect(service.contact(actor, 'me', 'booking-1')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.contact(actor, 'off', 'booking-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('chat pivote', () => {
    it('persiste los mensajes y los emite en vivo solo a las dos cuentas participantes', async () => {
      const { service, gateway, messageRows, notifications } = setup([{ ...ME }, stored({ id: 'keeper' })]);
      const { conversationId } = await service.contact(actor, 'keeper', 'booking-1', '¿Podés jugar el jueves?');

      const sent = await service.sendChatMessage({ ...actor, userId: 'keeper' }, conversationId, 'Sí, puedo.');

      expect(messageRows).toHaveLength(2);
      expect(sent.body).toBe('Sí, puedo.');
      expect(gateway.emitPivotChatMessage).toHaveBeenCalledTimes(2);
      expect(gateway.emitPivotChatMessage).toHaveBeenCalledWith('me', expect.objectContaining({ body: 'Sí, puedo.' }));
      expect(gateway.emitPivotChatMessage).toHaveBeenCalledWith('keeper', expect.objectContaining({ senderUserId: 'keeper' }));
      expect(notifications.notifyUser).toHaveBeenCalledWith('me', 'org-1', expect.objectContaining({ type: 'pivot_chat_message' }), 'keeper');
    });

    it('solo permite leer conversaciones de las que la cuenta es participante', async () => {
      const { service } = setup([{ ...ME }, stored({ id: 'keeper' }), stored({ id: 'intruder' })]);
      const { conversationId } = await service.contact(actor, 'keeper', 'booking-1');

      await expect(service.getChat({ ...actor, userId: 'intruder' }, conversationId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza mensajes vacíos o demasiado largos', async () => {
      const { service } = setup([{ ...ME }, stored({ id: 'keeper' })]);
      const { conversationId } = await service.contact(actor, 'keeper', 'booking-1');

      await expect(service.sendChatMessage(actor, conversationId, '  ')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.sendChatMessage(actor, conversationId, 'x'.repeat(1001))).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('solicitudes temporales', () => {
    it('muestra cancha, horario y nombre de quien solicitó a los participantes', async () => {
      const { service } = setup([{ ...ME }, stored({ id: 'keeper', fullName: 'Bruno' })]);
      await service.contact(actor, 'keeper', 'booking-1');

      const requesterList = await service.getMyRequests(actor);
      const pivotList = await service.getMyRequests({ ...actor, userId: 'keeper' });

      expect(requesterList[0]).toEqual(expect.objectContaining({
        requesterName: 'Ana Cliente', pivotName: 'Bruno', courtName: 'Cancha Norte',
        bookingId: 'booking-1', isRequester: true, canRespond: false,
      }));
      expect(pivotList[0]).toEqual(expect.objectContaining({
        requesterName: 'Ana Cliente', pivotName: 'Bruno', courtName: 'Cancha Norte',
        isRequester: false, canRespond: true,
      }));
    });

    it('permite al pivote aceptar o rechazar y notifica al solicitante', async () => {
      const { service, notifications } = setup([{ ...ME }, stored({ id: 'keeper' })]);
      const { conversationId } = await service.contact(actor, 'keeper', 'booking-1');

      await expect(service.respondToRequest({ ...actor, userId: 'keeper' }, conversationId, 'ACCEPTED'))
        .resolves.toEqual(expect.objectContaining({ id: conversationId, status: 'ACCEPTED' }));
      expect(notifications.notifyUser).toHaveBeenCalledWith(
        'me', 'org-1', expect.objectContaining({ title: 'El pivote confirmó' }), 'keeper',
      );
      await expect(service.respondToRequest(actor, conversationId, 'DECLINED')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.respondToRequest({ ...actor, userId: 'keeper' }, conversationId, 'DECLINED')).rejects.toThrow(/ya tiene una respuesta/);
    });
  });
});
