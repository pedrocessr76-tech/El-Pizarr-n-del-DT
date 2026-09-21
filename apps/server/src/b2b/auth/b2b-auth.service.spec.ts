import { UnauthorizedException } from '@nestjs/common';
import { B2bAuthService } from './b2b-auth.service';
import { B2bRoleCode, B2bRecordStatus } from '../entities/b2b.enums';

// Revalidación de la identidad B2B contra la BD (ALTO 7): roles y status
// nunca se confían al JWT; se recalculan en cada uso real.
describe('B2bAuthService - resolveUserFromToken', () => {
  const org = 'org-1';
  const claims = {
    userId: 'user-1',
    organizationId: org,
    email: 'viejo@correo.com',
    roles: [B2bRoleCode.OPERATOR], // roles del token: deben ignorarse
  };

  const activeUser = { id: 'user-1', organizationId: org, email: 'fresco@correo.com', status: B2bRecordStatus.ACTIVE };

  function setup({ user = null, organization = null, assignments = [] }: { user?: any; organization?: any; assignments?: any[] }) {
    const users = {
      findOne: jest.fn(async ({ where }: any) => {
        if (!user) return null;
        if (where.status && where.status !== user.status) return null;
        if (where.id && where.id !== user.id) return null;
        if (where.organizationId && where.organizationId !== user.organizationId) return null;
        return user;
      }),
    };
    const organizations = {
      findOne: jest.fn(async ({ where }: any) => {
        if (!organization) return null;
        if (where.status && where.status !== organization.status) return null;
        if (where.id && where.id !== organization.id) return null;
        return organization;
      }),
    };
    const userRoles = { find: jest.fn().mockResolvedValue(assignments) };
    const roles = { upsert: jest.fn() };
    const courts = {};
    const jwt = { sign: jest.fn() };
    const service = new B2bAuthService(organizations as never, roles as never, users as never, userRoles as never, courts as never, jwt as never);
    return { service, users, organizations, userRoles };
  }

  const activeOrg = { id: org, status: B2bRecordStatus.ACTIVE };

  it('recalcula los roles desde la BD y devuelve la identidad fresca (no los del token)', async () => {
    const { service } = setup({
      user: activeUser,
      organization: activeOrg,
      assignments: [
        { userId: 'user-1', organizationId: org, roleId: B2bRoleCode.CLIENT },
        { userId: 'user-1', organizationId: org, roleId: B2bRoleCode.ADMIN },
      ],
    });

    const resolved = await service.resolveUserFromToken(claims);

    expect(resolved.roles).toEqual([B2bRoleCode.CLIENT, B2bRoleCode.ADMIN]);
    expect(resolved.email).toBe('fresco@correo.com');
    expect(resolved).not.toEqual(expect.objectContaining({ roles: claims.roles }));
  });

  it('rechaza un usuario inexistente', async () => {
    const { service } = setup({ organization: activeOrg });
    await expect(service.resolveUserFromToken(claims)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un usuario con status INACTIVE (desactivado)', async () => {
    const { service } = setup({
      user: { ...activeUser, status: B2bRecordStatus.INACTIVE },
      organization: activeOrg,
      assignments: [{ userId: 'user-1', organizationId: org, roleId: B2bRoleCode.CLIENT }],
    });
    await expect(service.resolveUserFromToken(claims)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un complejo inexistente o inactivo', async () => {
    const missing = setup({ user: activeUser });
    await expect(missing.service.resolveUserFromToken(claims)).rejects.toBeInstanceOf(UnauthorizedException);

    const inactiveOrg = setup({ user: activeUser, organization: { id: org, status: B2bRecordStatus.INACTIVE } });
    await expect(inactiveOrg.service.resolveUserFromToken(claims)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un usuario sin roles asignados en la BD', async () => {
    const { service } = setup({ user: activeUser, organization: activeOrg });
    await expect(service.resolveUserFromToken(claims)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('un rol de staff degradado en la BD deja de presentarse (token degradado prematuramente)', async () => {
    const { service } = setup({
      user: activeUser,
      organization: activeOrg,
      assignments: [{ userId: 'user-1', organizationId: org, roleId: B2bRoleCode.CLIENT }],
    });

    const resolved = await service.resolveUserFromToken(claims);
    expect(resolved.roles).toEqual([B2bRoleCode.CLIENT]);
  });
});