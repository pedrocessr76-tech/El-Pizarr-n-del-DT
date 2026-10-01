import { BadRequestException } from '@nestjs/common';
import { B2bRoleCode } from './entities/b2b.enums';
import { B2bManagementService } from './b2b-management.service';

const OWNER = { organizationId: 'org-1', roles: [B2bRoleCode.OWNER] } as any;

function setup(overrides: Record<string, any> = {}) {
  const organization = {
    id: 'org-1',
    name: 'La Cancha',
    address: null,
    emailReminderIntervalsMinutes: [1440],
    whatsappReminderIntervalsMinutes: [30],
    ...overrides,
  };
  const organizations = {
    findOneByOrFail: jest.fn().mockResolvedValue(organization),
    save: jest.fn(async (value) => value),
  };
  const service = new B2bManagementService(
    organizations as never, {} as never, {} as never, {} as never, {} as never,
    {} as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never,
  );
  return { service, organizations, organization };
}

describe('Configuración de anticipaciones por canal (#34)', () => {
  it('guarda las dos listas de forma independiente', async () => {
    const { service, organizations } = setup();

    const saved = await service.updateOrganization(OWNER, {
      emailReminderIntervalsMinutes: [2880, 1440],
      whatsappReminderIntervalsMinutes: [60, 15],
    });

    expect(organizations.save).toHaveBeenCalledTimes(1);
    expect(saved.emailReminderIntervalsMinutes).toEqual([2880, 1440]);
    expect(saved.whatsappReminderIntervalsMinutes).toEqual([60, 15]);
  });

  it('deja el otro canal intacto si solo se envía una lista', async () => {
    const { service, organization } = setup();

    await service.updateOrganization(OWNER, { emailReminderIntervalsMinutes: [1440] });

    expect(organization.whatsappReminderIntervalsMinutes).toEqual([30]);
  });

  it('acepta la lista vacía para apagar un canal', async () => {
    const { service, organization } = setup();

    await service.updateOrganization(OWNER, { whatsappReminderIntervalsMinutes: [] });

    expect(organization.whatsappReminderIntervalsMinutes).toEqual([]);
  });

  it('normaliza a descendente y quita duplicados', async () => {
    const { service, organization } = setup();

    await service.updateOrganization(OWNER, { emailReminderIntervalsMinutes: [60, 1440, 60] });

    expect(organization.emailReminderIntervalsMinutes).toEqual([1440, 60]);
  });

  it('rechaza anticipaciones por debajo del mínimo', async () => {
    const { service, organizations } = setup();

    await expect(service.updateOrganization(OWNER, { emailReminderIntervalsMinutes: [1] }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(organizations.save).not.toHaveBeenCalled();
  });

  it('rechaza anticipaciones por encima de 7 días', async () => {
    const { service } = setup();

    await expect(service.updateOrganization(OWNER, { whatsappReminderIntervalsMinutes: [10081] }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza fracciones de minuto', async () => {
    const { service } = setup();

    await expect(service.updateOrganization(OWNER, { emailReminderIntervalsMinutes: [30.5] }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza más de 5 anticipaciones por canal', async () => {
    const { service } = setup();

    await expect(service.updateOrganization(OWNER, { emailReminderIntervalsMinutes: [5, 10, 15, 20, 25, 30] }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un valor que no sea número sin tocar la configuración', async () => {
    const { service, organizations } = setup();

    await expect(service.updateOrganization(OWNER, { emailReminderIntervalsMinutes: ['1440'] as never }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(organizations.save).not.toHaveBeenCalled();
  });
});
