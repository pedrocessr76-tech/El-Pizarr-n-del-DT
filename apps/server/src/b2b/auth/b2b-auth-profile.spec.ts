import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { B2bAuthService } from './b2b-auth.service';
import { B2bRoleCode, B2bRecordStatus } from '../entities/b2b.enums';

// Perfil y contacto de WhatsApp (#37): lectura, actualización con normalización
// E.164 y regla de consentimiento (vaciar el teléfono desactiva el opt-in).
describe('B2bAuthService - perfil y contacto de WhatsApp (getProfile/updateProfile)', () => {
  const org = 'org-1';

  function setup({ user = null }: { user?: any }) {
    const users = {
      findOne: jest.fn(async ({ where }: any) => {
        if (!user) return null;
        if (where.id && where.id !== user.id) return null;
        if (where.organizationId && where.organizationId !== user.organizationId) return null;
        return user;
      }),
      save: jest.fn(async (value: any) => value),
    };
    const organizations = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
    const userRoles = { find: jest.fn().mockResolvedValue([{ userId: 'user-1', organizationId: org, roleId: B2bRoleCode.CLIENT }]) };
    const roles = { upsert: jest.fn() };
    const courts = {};
    const facilities = {};
    const jwt = { sign: jest.fn() };
    const dataSource = { transaction: jest.fn() };
    const service = new B2bAuthService(organizations as never, roles as never, users as never, userRoles as never, courts as never, facilities as never, jwt as never, dataSource as never);
    return { service, users, organizations, userRoles };
  }

  const baseUser = {
    id: 'user-1',
    organizationId: org,
    email: 'cliente@correo.com',
    fullName: 'Martina',
    passwordHash: 'x',
    status: B2bRecordStatus.ACTIVE,
    whatsappPhone: null,
    whatsappOptIn: false,
  };

  it('getProfile devuelve el contacto y los roles releídos de la BD', async () => {
    const { service } = setup({ user: { ...baseUser, whatsappPhone: '+5491155551234', whatsappOptIn: true } });

    const profile = await service.getProfile('user-1', org);

    expect(profile).toEqual({
      userId: 'user-1',
      organizationId: org,
      email: 'cliente@correo.com',
      roles: [B2bRoleCode.CLIENT],
      whatsappPhone: '+5491155551234',
      whatsappOptIn: true,
    });
  });

  it('getProfile rechaza un usuario inexistente', async () => {
    const { service } = setup({});
    await expect(service.getProfile('user-1', org)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updateProfile normaliza el teléfono y persiste el opt-in', async () => {
    const { service, users } = setup({ user: { ...baseUser } });

    const updated = await service.updateProfile('user-1', org, {
      whatsappPhone: '+54 9 11 5555-1234',
      whatsappOptIn: true,
    });

    expect(updated.whatsappPhone).toBe('+5491155551234');
    expect(updated.whatsappOptIn).toBe(true);
    expect(users.save).toHaveBeenCalledWith(expect.objectContaining({ whatsappPhone: '+5491155551234', whatsappOptIn: true }));
  });

  it('vaciar el teléfono desactiva el consentimiento', async () => {
    const { service, users } = setup({ user: { ...baseUser, whatsappPhone: '+5491155551234', whatsappOptIn: true } });

    const updated = await service.updateProfile('user-1', org, { whatsappPhone: '' });

    expect(updated.whatsappPhone).toBeNull();
    expect(updated.whatsappOptIn).toBe(false);
    expect(users.save).toHaveBeenCalledWith(expect.objectContaining({ whatsappPhone: null, whatsappOptIn: false }));
  });

  it('rechaza un teléfono con formato inválido sin tocar el perfil', async () => {
    const { service, users } = setup({ user: { ...baseUser } });

    await expect(service.updateProfile('user-1', org, { whatsappPhone: '1155551234' })).rejects.toBeInstanceOf(BadRequestException);
    expect(users.save).not.toHaveBeenCalled();
  });
});

describe('B2bAuthService - contacto de la organización (updateOrganizationContact)', () => {
  function setup({ organization = null }: { organization?: any }) {
    const organizations = {
      findOne: jest.fn(async ({ where }: any) => {
        if (!organization) return null;
        if (where.id && where.id !== organization.id) return null;
        return organization;
      }),
      save: jest.fn(async (value: any) => value),
    };
    const users = {};
    const userRoles = {};
    const roles = { upsert: jest.fn() };
    const courts = {};
    const facilities = {};
    const jwt = { sign: jest.fn() };
    const dataSource = { transaction: jest.fn() };
    const service = new B2bAuthService(organizations as never, roles as never, users as never, userRoles as never, courts as never, facilities as never, jwt as never, dataSource as never);
    return { service, organizations };
  }

  const baseOrg = {
    id: 'org-1',
    name: 'Complejo',
    slug: 'complejo',
    status: B2bRecordStatus.ACTIVE,
    whatsappPhone: null,
    whatsappOptIn: false,
  };

  it('persiste el teléfono y opt-in de la organización', async () => {
    const { service, organizations } = setup({ organization: { ...baseOrg } });

    const result = await service.updateOrganizationContact('org-1', { whatsappPhone: '+5491155550000', whatsappOptIn: true });

    expect(result).toEqual({ whatsappPhone: '+5491155550000', whatsappOptIn: true });
    expect(organizations.save).toHaveBeenCalledWith(expect.objectContaining({ whatsappPhone: '+5491155550000', whatsappOptIn: true }));
  });

  it('rechaza teléfono inválido para la organización', async () => {
    const { service, organizations } = setup({ organization: { ...baseOrg } });

    await expect(service.updateOrganizationContact('org-1', { whatsappPhone: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
    expect(organizations.save).not.toHaveBeenCalled();
  });
});