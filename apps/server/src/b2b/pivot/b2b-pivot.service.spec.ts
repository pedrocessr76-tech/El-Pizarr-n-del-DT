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
    const service = new B2bPivotService(users as never, notifications as never);
    return { service, users, notifications };
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

    it('expone el teléfono solo cuando el jugador autorizó WhatsApp', async () => {
      const { service } = setup([
        { ...ME },
        stored({ id: 'optin', whatsappPhone: '+5491100000009', whatsappOptIn: true }),
        stored({ id: 'nooptin', whatsappPhone: '+5491100000008', whatsappOptIn: false }),
      ]);

      const players = await service.listAvailable(actor);

      expect(players.find((player) => player.userId === 'optin')).toEqual(
        expect.objectContaining({ whatsappPhone: '+5491100000009', whatsappOptIn: true }),
      );
      expect(players.find((player) => player.userId === 'nooptin')).toEqual(
        expect.objectContaining({ whatsappPhone: null, whatsappOptIn: false }),
      );
    });
  });

  describe('contact', () => {
    it('notifica al pivote y devuelve su WhatsApp si autorizó', async () => {
      const { service, notifications } = setup([
        { ...ME },
        stored({ id: 'keeper', fullName: 'Bruno', whatsappPhone: '+5491100000009', whatsappOptIn: true }),
      ]);

      const result = await service.contact(actor, 'keeper', '  Necesitamos arquero  ');

      expect(result).toEqual({ sent: true, whatsappPhone: '+5491100000009' });
      expect(notifications.notifyUser).toHaveBeenCalledWith(
        'keeper',
        'org-1',
        expect.objectContaining({ type: 'pivot_contact_request', severity: 'info' }),
        'me',
      );
      expect(notifications.notifyUser.mock.calls[0][2].body).toContain('Necesitamos arquero');
      expect(notifications.notifyUser.mock.calls[0][2].metadata).toEqual({
        fromUserId: 'me',
        fromName: 'Ana Cliente',
        fromEmail: ME.email,
      });
    });

    it('omite el teléfono cuando el destinatario no autorizó WhatsApp', async () => {
      const { service } = setup([{ ...ME }, stored({ id: 'keeper', whatsappPhone: '+5491100000009' })]);

      await expect(service.contact(actor, 'keeper')).resolves.toEqual({ sent: true, whatsappPhone: null });
    });

    it('rechaza contactarse a uno mismo o a un pivote que ya no está disponible', async () => {
      const { service } = setup([{ ...ME }, stored({ id: 'off', pivotAvailable: false })]);

      await expect(service.contact(actor, 'me')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.contact(actor, 'off')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
