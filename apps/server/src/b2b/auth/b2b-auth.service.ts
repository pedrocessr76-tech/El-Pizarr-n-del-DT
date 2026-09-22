import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bRecordStatus, B2bRoleCode } from '../entities/b2b.enums';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bFacilityEntity } from '../entities/facility.entity';
import { B2bRoleEntity } from '../entities/role.entity';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bJwtUser } from './b2b-auth.types';

const roleNames: Record<B2bRoleCode, string> = {
  [B2bRoleCode.OWNER]: 'Propietario',
  [B2bRoleCode.ADMIN]: 'Administrador',
  [B2bRoleCode.OPERATOR]: 'Operador',
  [B2bRoleCode.CLIENT]: 'Cliente',
};

@Injectable()
export class B2bAuthService {
  constructor(
    @InjectRepository(B2bOrganizationEntity, 'b2b') private readonly organizations: Repository<B2bOrganizationEntity>,
    @InjectRepository(B2bRoleEntity, 'b2b') private readonly roles: Repository<B2bRoleEntity>,
    @InjectRepository(B2bUserEntity, 'b2b') private readonly users: Repository<B2bUserEntity>,
    @InjectRepository(B2bUserRoleEntity, 'b2b') private readonly userRoles: Repository<B2bUserRoleEntity>,
    @InjectRepository(B2bCourtEntity, 'b2b') private readonly courts: Repository<B2bCourtEntity>,
    @InjectRepository(B2bFacilityEntity, 'b2b') private readonly facilities: Repository<B2bFacilityEntity>,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const assignments = await this.userRoles.find({ where: { userId: user.id, organizationId: user.organizationId } });
    return this.issueToken(user, assignments.map((assignment) => assignment.roleId));
  }

  async listPublicOrganizations() {
    return this.organizations.find({
      where: { status: B2bRecordStatus.ACTIVE },
      select: { id: true, name: true, slug: true },
      order: { name: 'ASC' },
    });
  }

  async listPublicCourts(organizationId: string) {
    const organization = await this.organizations.findOne({ where: { id: organizationId, status: B2bRecordStatus.ACTIVE } });
    if (!organization) throw new UnprocessableEntityException('El complejo no existe o no está activo.');
    return this.courts.find({
      where: { organizationId, status: B2bRecordStatus.ACTIVE },
      select: { id: true, name: true, sportType: true, capacity: true, defaultPriceCentsArs: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Complejos (facilities) públicos de una organización con sus canchas activas.
   * El portal cliente agrupa por complejo, no por organización: así un complejo
   * recién creado aparece de inmediato y las canchas quedan en su sede.
   */
  async listPublicFacilities(organizationId: string) {
    const organization = await this.organizations.findOne({ where: { id: organizationId, status: B2bRecordStatus.ACTIVE } });
    if (!organization) throw new UnprocessableEntityException('El complejo no existe o no está activo.');
    const facilities = await this.facilities.find({
      where: { organizationId, status: B2bRecordStatus.ACTIVE },
      order: { name: 'ASC' },
    });
    if (facilities.length === 0) return [];
    const courts = await this.courts.find({
      where: { organizationId, status: B2bRecordStatus.ACTIVE },
      order: { name: 'ASC' },
    });
    return facilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      address: facility.address,
      courts: courts
        .filter((court) => court.facilityId === facility.id)
        .map((court) => ({ id: court.id, name: court.name, sportType: court.sportType, capacity: court.capacity, defaultPriceCentsArs: court.defaultPriceCentsArs })),
    }));
  }

  async registerClient(input: { email: string; fullName: string; password: string; organizationId?: string }) {
    await this.ensureRoles();
    let organization = await this.organizations.findOne({ where: { status: B2bRecordStatus.ACTIVE } });
    if (input.organizationId) {
      const selected = await this.organizations.findOne({ where: { id: input.organizationId, status: B2bRecordStatus.ACTIVE } });
      if (selected) organization = selected;
    }
    if (!organization) throw new UnprocessableEntityException('No hay complejos disponibles para registrarse.');
    const email = input.email.toLowerCase();
    const existing = await this.users.findOne({ where: { organizationId: organization.id, email } });
    if (existing) throw new ConflictException('Ya existe una cuenta con ese email en este complejo.');
    const user = await this.users.save(this.users.create({
      organizationId: organization.id,
      email,
      fullName: input.fullName,
      passwordHash: await bcrypt.hash(input.password, 12),
    }));
    await this.userRoles.save({ userId: user.id, organizationId: organization.id, roleId: B2bRoleCode.CLIENT });
    return this.issueToken(user, [B2bRoleCode.CLIENT]);
  }

  async ensureRoles() {
    for (const [id, name] of Object.entries(roleNames)) {
      await this.roles.upsert({ id: id as B2bRoleCode, name }, ['id']);
    }
  }

  private issueToken(user: B2bUserEntity, roles: B2bRoleCode[]) {
    const payload = { userId: user.id, organizationId: user.organizationId, email: user.email, roles };
    return { accessToken: this.jwt.sign(payload), user: payload };
  }

  /**
   * Revalida una identidad B2B contra la BD (ALTO: roles y status no se confían
   * al JWT):
   *  - el usuario debe existir, pertenecer a la org del token y estar ACTIVE;
   *  - el complejo debe existir y estar ACTIVE;
   *  - los roles se recalculan desde b2b_user_roles (nunca desde el token).
   *
   * Lanza UnauthorizedException si algo no cuadra. Lo usan la estrategia
   * passport (REST) y el handshake del gateway de WS, para que un cambio de
   * rol/status se aplique sin esperar a que expire el JWT (7 días).
   */
  async resolveUserFromToken(payload: B2bJwtUser): Promise<B2bJwtUser> {
    const invalid = () => new UnauthorizedException('Sesión B2B inválida');
    if (!payload?.userId || !payload?.organizationId) throw invalid();

    const user = await this.users.findOne({
      where: { id: payload.userId, organizationId: payload.organizationId, status: B2bRecordStatus.ACTIVE },
    });
    if (!user) throw invalid();

    const organization = await this.organizations.findOne({
      where: { id: payload.organizationId, status: B2bRecordStatus.ACTIVE },
    });
    if (!organization) throw invalid();

    const assignments = await this.userRoles.find({
      where: { userId: user.id, organizationId: user.organizationId },
    });
    const roles = Array.from(new Set(assignments.map((assignment) => assignment.roleId)));
    if (roles.length === 0) throw invalid();

    return { userId: user.id, organizationId: user.organizationId, email: user.email, roles };
  }
}