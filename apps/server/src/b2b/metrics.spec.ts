import { BadRequestException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { B2bRoleCode } from './entities/b2b.enums';

// Las métricas del día se calculan con la zona horaria de la organización, no
// con la del servidor: un turno a las 00:00 de Asia/Tokyo pertenece al día
// 2026-01-08 y no al 07 aunque, visto desde la zona del proceso, caiga el 07.
describe('Métricas del día (zona de la organización)', () => {
  const TOKYO = 'Asia/Tokyo';
  const user = { userId: 'u', organizationId: 'org', email: 'owner@test.invalid', roles: [B2bRoleCode.ADMIN] };

  function setup() {
    const betweenArgs: Date[][] = [];
    const organizations = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'org', timezone: TOKYO }) };
    const shifts = { find: jest.fn(async ({ where }: { where: { startsAt: { _value: Date[] } } }) => { betweenArgs.push(where.startsAt._value); return []; }) };
    const bookings = { find: jest.fn().mockResolvedValue([]) };
    const service = new B2bManagementService(
      organizations as never, {} as never, {} as never, {} as never,
      shifts as never, {} as never, bookings as never, {} as never,
      {} as never, {} as never, {} as never,
    );
    return { service, organizations, betweenArgs };
  }

  it('mapea una fecha YYYY-MM-DD a la medianoche local de la organización', async () => {
    const { service, betweenArgs } = setup();
    const metrics = await service.metricsSummary(user, '2026-01-08');

    expect(metrics.date).toBe('2026-01-08');
    expect(betweenArgs).toHaveLength(1);
    expect(betweenArgs[0][0].toISOString()).toBe('2026-01-07T15:00:00.000Z');
    expect(betweenArgs[0][1].toISOString()).toBe('2026-01-08T15:00:00.000Z');
  });

  it('rechaza una fecha que no sea YYYY-MM-DD', async () => {
    const { service } = setup();
    await expect(service.metricsSummary(user, '08/01/2026')).rejects.toThrow(BadRequestException);
    await expect(service.metricsSummary(user, '2026-13-40')).rejects.toThrow(BadRequestException);
  });
});