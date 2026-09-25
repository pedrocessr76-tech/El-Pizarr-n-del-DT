import { UnauthorizedException } from '@nestjs/common';
import { B2bAuthService } from './b2b-auth.service';
import { B2bRoleCode, B2bRecordStatus } from '../entities/b2b.enums';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bFacilityEntity } from '../entities/facility.entity';

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
    const facilities = {};
    const jwt = { sign: jest.fn() };
    const unitOfWork = { execute: jest.fn() };
    const service = new B2bAuthService(organizations as never, roles as never, users as never, userRoles as never, courts as never, facilities as never, jwt as never, unitOfWork as never);
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

// Onboarding de propietario: reemplaza al seed en producción para dar de alta un
// complejo con su cuenta OWNER (issue #16). La creación corre en UNA transacción
// (DataSource 'b2b') para que un fallo intermedio no deje una org huérfana.
describe('B2bAuthService - onboardOwner', () => {
  function setup() {
    const organizations = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (value: any) => ({ id: 'org-nueva', ...value })),
      create: jest.fn((value: any) => value),
    };
    const roles = { upsert: jest.fn().mockResolvedValue(undefined) };
    const users = {
      save: jest.fn(async (value: any) => ({ id: 'user-nuevo', ...value })),
      create: jest.fn((value: any) => value),
    };
    const userRoles = { save: jest.fn().mockResolvedValue(undefined) };
    const courts = {};
    const facilities = {
      save: jest.fn(async (value: any) => ({ id: 'facility-nueva', ...value })),
      create: jest.fn((value: any) => value),
    };
    const jwt = { sign: jest.fn(() => 'jwt-firmado') };
    const manager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === B2bOrganizationEntity) return organizations;
        if (entity === B2bUserEntity) return users;
        if (entity === B2bUserRoleEntity) return userRoles;
        if (entity === B2bFacilityEntity) return facilities;
        return {};
      }),
    };
    // Simula UnitOfWork: expone sólo repositorios del manager transaccional.
    const unitOfWork = {
      execute: jest.fn(async (work: any) => work({ get: (entity: any) => manager.getRepository(entity) })),
    };
    const service = new B2bAuthService(organizations as never, roles as never, users as never, userRoles as never, courts as never, facilities as never, jwt as never, unitOfWork as never);
    return { service, organizations, users, userRoles, facilities, manager, unitOfWork };
  }

  const input = {
    organizationName: 'Complejo Los Amigos',
    facilityName: 'Sede Central',
    ownerFullName: 'Carlos Bianchi',
    email: 'DUENO@amigos.com',
    password: 'clave-segura-2026',
  };

  it('crea la organización con su slug único, la cuenta OWNER, la sede y emite token', async () => {
    const { service, organizations, users, userRoles, facilities } = setup();

    const result = await service.onboardOwner(input);

    expect(result.user.roles).toEqual([B2bRoleCode.OWNER]);
    expect(result.accessToken).toBe('jwt-firmado');
    expect(organizations.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Complejo Los Amigos', slug: 'complejo-los-amigos' }),
    );
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-nueva',
        email: 'dueno@amigos.com',
        fullName: 'Carlos Bianchi',
        passwordHash: expect.any(String),
      }),
    );
    expect(userRoles.save).toHaveBeenCalledWith({
      userId: 'user-nuevo',
      organizationId: 'org-nueva',
      roleId: B2bRoleCode.OWNER,
    });
    expect(facilities.save).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-nueva', name: 'Sede Central' }),
    );
  });

  it('resuelve slugs únicos agregando sufijo numérico ante colisiones', async () => {
    const { service, organizations } = setup();
    organizations.findOne
      .mockResolvedValueOnce({ id: 'org-1' }) // 'complejo-los-amigos' ocupado
      .mockResolvedValueOnce(null); // 'complejo-los-amigos-2' libre

    await service.onboardOwner(input);

    expect(organizations.save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'complejo-los-amigos-2' }));
  });

  it('normaliza el nombre de la organización a un slug ASCII', async () => {
    const { service, organizations } = setup();

    await service.onboardOwner({ ...input, organizationName: 'Complejo Ánimas Ñuble' });

    expect(organizations.save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'complejo-animas-nuble' }));
  });

  it('no crea sede si no se envía facilityName', async () => {
    const { service, facilities } = setup();

    await service.onboardOwner({ ...input, facilityName: undefined });

    expect(facilities.save).not.toHaveBeenCalled();
  });

  it('si falla un paso intermedio, toda la creación corre dentro de la transacción (rollback, sin org huérfana)', async () => {
    const { service, users, unitOfWork, manager } = setup();
    users.save.mockRejectedValueOnce(new Error('falla al guardar el dueño'));

    await expect(service.onboardOwner(input)).rejects.toThrow('falla al guardar el dueño');

    // Los writes van por el manager transaccional: si el callback lanza, TypeORM
    // revierte (rollback) y no queda la organización creada sin su dueño.
    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(manager.getRepository).toHaveBeenCalledWith(B2bOrganizationEntity);
    expect(manager.getRepository).toHaveBeenCalledWith(B2bUserEntity);
    expect(manager.getRepository).toHaveBeenCalledWith(B2bUserRoleEntity);
  });
});

// Refresh token en cookie HttpOnly (issue #17): el access token es corto y la
// sesión larga la renueva un refresh token que SOLO sirve (claim type=refresh)
// y que revalida la identidad contra la BD antes de rotar.
describe('B2bAuthService - refresh', () => {
  const org = 'org-1';

  function setupRefresh({ claims, userId = 'user-1', organizationActive = true }: { claims: any; userId?: string | null; organizationActive?: boolean }) {
    const users = {
      findOne: jest.fn(async ({ where }: any) => {
        if (!userId) return null;
        if (where.id && where.id !== userId) return null;
        if (where.organizationId && where.organizationId !== org) return null;
        return { id: userId, organizationId: org, email: 'fresco@correo.com', status: B2bRecordStatus.ACTIVE };
      }),
    };
    const organizations = {
      findOne: jest.fn(async () =>
        organizationActive ? { id: org, status: B2bRecordStatus.ACTIVE } : null,
      ),
    };
    const userRoles = {
      find: jest.fn(async () => [{ userId: 'user-1', organizationId: org, roleId: B2bRoleCode.CLIENT }]),
    };
    const roles = { upsert: jest.fn() };
    const courts = {};
    const facilities = {};
    const jwt = {
      sign: jest.fn(() => 'jwt-firmado'),
      verify: jest.fn(() => claims),
    };
    const unitOfWork = { execute: jest.fn() };
    const service = new B2bAuthService(organizations as never, roles as never, users as never, userRoles as never, courts as never, facilities as never, jwt as never, unitOfWork as never);
    return { service, users, organizations, jwt };
  }

  it('rotar el par revalidando la identidad contra la BD', async () => {
    const { service, users, jwt } = setupRefresh({
      claims: { userId: 'user-1', organizationId: org, type: 'refresh' },
    });

    const session = await service.refresh('refresh-token');

    expect(jwt.verify).toHaveBeenCalledWith('refresh-token');
    expect(users.findOne).toHaveBeenCalled();
    expect(session.accessToken).toBe('jwt-firmado');
    expect(session.refreshToken).toBe('jwt-firmado');
    expect(session.user.roles).toEqual([B2bRoleCode.CLIENT]);
  });

  it('rechaza un token sin claim type=refresh sin consultar la BD', async () => {
    const { service, users } = setupRefresh({ claims: { userId: 'user-1', organizationId: org } });

    await expect(service.refresh('access-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('rechaza un refresh de un usuario desactivado o eliminado', async () => {
    const { service, jwt } = setupRefresh({ claims: { userId: 'user-1', organizationId: org, type: 'refresh' }, userId: null });

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.verify).toHaveBeenCalled();
  });
});
