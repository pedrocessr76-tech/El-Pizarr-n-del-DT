import { B2bNotificationsService } from './notifications/b2b-notifications.service';
import { B2bRoleCode } from './entities/b2b.enums';
import { getInValues, isInValues } from '../persistence/repository.port';

// Service de notificaciones B2B con repositorios simulados: verifica el
// fan-out por destinatario, la supresión del actor y el marcado como leído.
describe('B2bNotificationsService', () => {
  const org = 'org';
  const opts = {
    type: 'b2b_booking_pending' as const,
    severity: 'info' as const,
    title: 'Nueva reserva',
    body: 'Cancha 1 — hoy 13:00',
  };

  function setup(assignments: Array<{ userId: string; organizationId: string; roleId: B2bRoleCode }>) {
    const savedRows: Array<Record<string, unknown>> = [];
    const notifications = {
      create: jest.fn((rows) => rows.map((row: Record<string, unknown>) => ({ id: 'n-' + Math.random().toString(36).slice(2), read: false, createdAt: new Date(), ...row }))),
      save: jest.fn(async (rows) => {
        savedRows.push(...rows);
        return rows;
      }),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(2),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const inValue = (val: unknown): unknown[] | null => {
      if (Array.isArray(val)) return val;
      if (isInValues(val)) return getInValues(val);
      return val ? [val] : null;
    };
    const userRoles = {
      find: jest.fn(async ({ where }: { where?: { organizationId?: string; roleId?: unknown } } = {}) =>
        assignments.filter((assignment) => {
          if (where?.organizationId && assignment.organizationId !== where.organizationId) return false;
          const roles = inValue(where?.roleId);
          if (roles && !roles.includes(assignment.roleId)) return false;
          return true;
        }),
      ),
    };
    const users = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'client', email: 'client@test.invalid', fullName: 'Carlos Cliente' }),
    };
    const gateway = {
      emitToUser: jest.fn(),
      emitToOrganization: jest.fn(),
    };
    const service = new B2bNotificationsService(
      notifications as never,
      userRoles as never,
      users as never,
      gateway as never,
    );
    return { service, notifications, userRoles, users, gateway, savedRows };
  }

  it('notifyStaff reparte una fila por integrante staff y emite su canal y el de la org', async () => {
    const { service, notifications, userRoles, gateway, savedRows } = setup([
      { userId: 'staff1', organizationId: org, roleId: B2bRoleCode.OWNER },
      { userId: 'staff2', organizationId: org, roleId: B2bRoleCode.ADMIN },
      { userId: 'client1', organizationId: org, roleId: B2bRoleCode.CLIENT },
    ]);
    const payloads = await service.notifyStaff(org, opts);

    expect(userRoles.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: org }) }),
    );
    expect(notifications.create).toHaveBeenCalled();
    expect(notifications.save).toHaveBeenCalled();
    expect(savedRows).toHaveLength(2);
    expect(savedRows.map((row) => row.recipientUserId).sort()).toEqual(['staff1', 'staff2']);
    expect(gateway.emitToUser).toHaveBeenCalledTimes(2);
    expect(gateway.emitToUser).toHaveBeenCalledWith('staff1', expect.objectContaining({ id: payloads.payloads[0].id }));
    expect(gateway.emitToOrganization).toHaveBeenCalledWith(org, expect.objectContaining({ type: 'b2b_booking_pending', severity: 'info' }));
  });

  it('notifyStaff excluye al actor que desencadena el evento', async () => {
    const { service, savedRows } = setup([
      { userId: 'staff1', organizationId: org, roleId: B2bRoleCode.OWNER },
      { userId: 'staff2', organizationId: org, roleId: B2bRoleCode.ADMIN },
    ]);
    await service.notifyStaff(org, opts, 'staff1');
    expect(savedRows.map((row) => row.recipientUserId)).toEqual(['staff2']);
  });

  it('getStaffUserIds devuelve solo roles de staff (OWNER/ADMIN/OPERATOR)', async () => {
    const { service, userRoles } = setup([
      { userId: 'staff1', organizationId: org, roleId: B2bRoleCode.OWNER },
      { userId: 'op1', organizationId: org, roleId: B2bRoleCode.OPERATOR },
      { userId: 'client1', organizationId: org, roleId: B2bRoleCode.CLIENT },
    ]);
    const ids = await service.getStaffUserIds(org);
    expect(ids.sort()).toEqual(['op1', 'staff1']);
    expect(userRoles.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ roleId: expect.anything() }) }),
    );
  });

  it('notifyUser persiste y emite al canal personal con el id de la fila', async () => {
    const { service, gateway, savedRows } = setup([]);
    const payloads = await service.notifyUser('client', org, {
      ...opts,
      type: 'b2b_booking_confirmed',
      severity: 'success',
      title: 'Reserva confirmada',
    });

    expect(savedRows).toHaveLength(1);
    expect(savedRows[0].recipientUserId).toBe('client');
    expect(gateway.emitToUser).toHaveBeenCalledTimes(1);
    expect(gateway.emitToUser).toHaveBeenCalledWith('client', expect.objectContaining({ id: payloads.payloads[0].id }));
    expect(gateway.emitToOrganization).toHaveBeenCalledWith(org, expect.not.objectContaining({ id: expect.any(String) }));
  });

  it('notifyUser no auto-notifica al actor', async () => {
    const { service, savedRows, gateway } = setup([]);
    const payloads = await service.notifyUser('client', org, opts, 'client');
    expect(payloads.payloads).toEqual([]);
    expect(payloads.saved).toEqual([]);
    expect(savedRows).toHaveLength(0);
    expect(gateway.emitToUser).not.toHaveBeenCalled();
  });

  it('broadcastToOrganization notifica a todos los usuarios de la org excepto el actor', async () => {
    const { service, savedRows, gateway } = setup([
      { userId: 'staff1', organizationId: org, roleId: B2bRoleCode.OWNER },
      { userId: 'client1', organizationId: org, roleId: B2bRoleCode.CLIENT },
    ]);
    await service.broadcastToOrganization(org, { ...opts, type: 'b2b_org_announcement', severity: 'info', title: 'Aviso', body: 'Mantenimiento' }, 'client1');

    expect(savedRows).toHaveLength(1);
    expect(savedRows[0].recipientUserId).toBe('staff1');
    expect(gateway.emitToUser).toHaveBeenCalledTimes(1);
    expect(gateway.emitToOrganization).toHaveBeenCalledWith(org, expect.objectContaining({ type: 'b2b_org_announcement' }));
  });

  it('un CLIENTE destinatario recibe su copia con id por su canal personal (aislamiento por identidad)', async () => {
    const { service, gateway } = setup([
      { userId: 'staff1', organizationId: org, roleId: B2bRoleCode.OWNER },
      { userId: 'client1', organizationId: org, roleId: B2bRoleCode.CLIENT },
    ]);
    const payloads = await service.broadcastToOrganization(
      org,
      { ...opts, type: 'b2b_org_announcement', severity: 'info', title: 'Aviso', body: 'Cambio de horario' },
      'staff1', // el actor es staff: el cliente SÍ es destinatario
    );

    const clientPayload = payloads.payloads.find((p) => p.id);
    expect(payloads.saved.length).toBe(1);
    expect(payloads.saved[0].recipientUserId).toBe('client1');
    expect(gateway.emitToUser).toHaveBeenCalledWith('client1', expect.objectContaining({ id: clientPayload?.id }));
  });

  it('listForUser devuelve el historial y el conteo de no leídas', async () => {
    const { service } = setup([]);
    const result = await service.listForUser({ userId: 'staff1', organizationId: org, email: 'a@b.c', roles: [B2bRoleCode.OWNER] });
    expect(result.unreadCount).toBe(2);
    expect(result.items).toEqual([]);
  });

  it('markRead está acotado al destinatario y refleja si hubo actualización', async () => {
    const { service, notifications } = setup([]);
    const result = await service.markRead({ userId: 'staff1', organizationId: org, email: 'a@b.c', roles: [B2bRoleCode.OWNER] }, 'n-1');
    expect(notifications.update).toHaveBeenCalledWith(
      { id: 'n-1', recipientUserId: 'staff1' },
      { read: true },
    );
    expect(result.updated).toBe(true);
  });

  it('markAllRead actualiza solo las no leídas del usuario', async () => {
    const { service, notifications } = setup([]);
    const result = await service.markAllRead({ userId: 'staff1', organizationId: org, email: 'a@b.c', roles: [B2bRoleCode.OWNER] });
    expect(notifications.update).toHaveBeenCalledWith(
      { recipientUserId: 'staff1', read: false },
      { read: true },
    );
    expect(result.updated).toBe(1);
  });
});
