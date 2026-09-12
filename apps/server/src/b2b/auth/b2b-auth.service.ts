import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bRecordStatus, B2bRoleCode } from '../entities/b2b.enums';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bRoleEntity } from '../entities/role.entity';
import { B2bUserRoleEntity } from '../entities/user-role.entity';
import { B2bUserEntity } from '../entities/user.entity';

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
    private readonly jwt: JwtService,
  ) {}

  async registerOrganization(input: { organizationName: string; slug: string; email: string; fullName: string; password: string }) {
    const existing = await this.organizations.findOne({ where: { slug: input.slug } });
    if (existing) throw new ConflictException('El slug de organización ya existe');
    const organization = await this.organizations.save(
      this.organizations.create({ name: input.organizationName, slug: input.slug }),
    );
    await this.ensureRoles();
    const user = await this.users.save(this.users.create({
      organizationId: organization.id,
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash: await bcrypt.hash(input.password, 12),
    }));
    await this.userRoles.save({ userId: user.id, organizationId: organization.id, roleId: B2bRoleCode.OWNER });
    return this.issueToken(user, [B2bRoleCode.OWNER]);
  }

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
}