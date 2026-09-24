import { BadRequestException, ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bRecordStatus, B2bRoleCode } from '../entities/b2b.enums';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bFacilityEntity } from '../entities/facility.entity';
import { B2bRoleEntity } from '../entities/role.entity';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bJwtUser } from './b2b-auth.types';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, REFRESH_TOKEN_TYPE } from '../../auth/tokens';
import { normalizeWhatsAppPhone } from '../phone';

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
    @InjectDataSource('b2b') private readonly dataSource: DataSource,
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

  /**
   * Perfil completo del usuario B2B con su contacto de WhatsApp (#37).
   * Los roles se releen de la BD (nunca del JWT), igual que resolveUserFromToken.
   */
  async getProfile(userId: string, organizationId: string) {
    const user = await this.users.findOne({ where: { id: userId, organizationId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');
    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      roles: await this.loadRoles(user.id, user.organizationId),
      whatsappPhone: user.whatsappPhone ?? null,
      whatsappOptIn: user.whatsappOptIn,
    };
  }

  /**
   * Actualiza el contacto de WhatsApp del usuario (#37). El teléfono se guarda
   * normalizado a E.164 (phone.ts). Vaciar el teléfono desactiva el contacto y
   * deja `whatsappOptIn=false`. Formato inválido → BadRequest.
   */
  async updateProfile(userId: string, organizationId: string, input: { whatsappPhone?: string; whatsappOptIn?: boolean }) {
    const user = await this.users.findOne({ where: { id: userId, organizationId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');
    const result = normalizeWhatsAppPhone(input.whatsappPhone ?? user.whatsappPhone ?? null);
    if (!result.valid) {
      throw new BadRequestException('Número de WhatsApp inválido. Usá formato internacional, p. ej. +5491112345678.');
    }
    user.whatsappPhone = result.value;
    user.whatsappOptIn = result.value === null ? false : (input.whatsappOptIn ?? user.whatsappOptIn);
    await this.users.save(user);
    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      roles: await this.loadRoles(user.id, user.organizationId),
      whatsappPhone: user.whatsappPhone,
      whatsappOptIn: user.whatsappOptIn,
    };
  }

  /** Actualiza el contacto de WhatsApp de la organización (#37, staff de administración). */
  async updateOrganizationContact(organizationId: string, input: { whatsappPhone?: string; whatsappOptIn?: boolean }) {
    const organization = await this.organizations.findOne({ where: { id: organizationId } });
    if (!organization) throw new UnauthorizedException('Complejo no encontrado.');
    const result = normalizeWhatsAppPhone(input.whatsappPhone ?? organization.whatsappPhone ?? null);
    if (!result.valid) {
      throw new BadRequestException('Número de WhatsApp inválido. Usá formato internacional, p. ej. +5491112345678.');
    }
    organization.whatsappPhone = result.value;
    organization.whatsappOptIn = result.value === null ? false : (input.whatsappOptIn ?? organization.whatsappOptIn);
    await this.organizations.save(organization);
    return { whatsappPhone: organization.whatsappPhone, whatsappOptIn: organization.whatsappOptIn };
  }

  private async loadRoles(userId: string, organizationId: string): Promise<B2bRoleCode[]> {
    const assignments = await this.userRoles.find({ where: { userId, organizationId } });
    return Array.from(new Set(assignments.map((assignment) => assignment.roleId)));
  }

  async ensureRoles() {
    for (const [id, name] of Object.entries(roleNames)) {
      await this.roles.upsert({ id: id as B2bRoleCode, name }, ['id']);
    }
  }

  /**
   * Onboarding de propietario: crea la organización con su cuenta OWNER y una
   * sede inicial opcional. Es la vía pública para dar de alta un complejo sin
   * depender del seed (que queda restringido a desarrollo).
   *
   * Toda la creación corre en UNA transacción: si falla cualquier paso (usuario,
   * rol o sede), se revierte la organización y no queda un complejo huérfano sin
   * dueño.
   */
  async onboardOwner(input: { organizationName: string; facilityName?: string; ownerFullName: string; email: string; password: string }) {
    await this.ensureRoles();
    return this.dataSource.transaction(async (manager) => {
      const organizations = manager.getRepository(B2bOrganizationEntity);
      const users = manager.getRepository(B2bUserEntity);
      const userRoles = manager.getRepository(B2bUserRoleEntity);
      const facilities = manager.getRepository(B2bFacilityEntity);

      const name = input.organizationName.trim();
      const slug = await this.buildUniqueSlug(organizations, name);
      const email = input.email.toLowerCase();
      const organization = await organizations.save(organizations.create({ name, slug }));
      const owner = await users.save(
        users.create({
          organizationId: organization.id,
          email,
          fullName: input.ownerFullName.trim(),
          passwordHash: await bcrypt.hash(input.password, 12),
        }),
      );
      await userRoles.save({ userId: owner.id, organizationId: organization.id, roleId: B2bRoleCode.OWNER });
      if (input.facilityName && input.facilityName.trim()) {
        await facilities.save(facilities.create({ organizationId: organization.id, name: input.facilityName.trim() }));
      }
      return this.issueToken(owner, [B2bRoleCode.OWNER]);
    });
  }

  private slugify(name: string): string {
    return (
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'complejo'
    );
  }

  private async buildUniqueSlug(organizations: Repository<B2bOrganizationEntity>, organizationName: string): Promise<string> {
    const base = this.slugify(organizationName);
    let slug = base;
    let suffix = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await organizations.findOne({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  /**
   * Access token corto (en memoria en el cliente) + refresh token de 7d en
   * cookie HttpOnly (issue #17). El refresh lleva claim `type: 'refresh'` para
   * que un access token robado no pueda usarse para renovar la sesión.
   */
  private issueTokenFrom(payload: B2bJwtUser) {
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      refreshToken: this.jwt.sign({ ...payload, type: REFRESH_TOKEN_TYPE }, { expiresIn: REFRESH_TOKEN_TTL }),
      user: payload,
    };
  }

  private issueToken(user: B2bUserEntity, roles: B2bRoleCode[]) {
    return this.issueTokenFrom({ userId: user.id, organizationId: user.organizationId, email: user.email, roles });
  }

  /**
   * Renueva la sesión B2B a partir del refresh token (cookie HttpOnly).
   * Revalida la identidad contra la BD (misma política que resolveUserFromToken:
   * roles/status nunca se confían al JWT) y rota el par completo.
   */
  async refresh(refreshToken: string) {
    let claims: B2bJwtUser & { type?: string };
    try {
      claims = this.jwt.verify<B2bJwtUser & { type?: string }>(refreshToken);
    } catch {
      throw new UnauthorizedException('La sesión expiró. Volvé a iniciar sesión.');
    }
    if (claims.type !== REFRESH_TOKEN_TYPE) {
      throw new UnauthorizedException('Token de refresco inválido.');
    }
    const fresh = await this.resolveUserFromToken(claims);
    return this.issueTokenFrom(fresh);
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