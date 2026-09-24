import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { B2bRoleCode } from './entities/b2b.enums';
import { B2bCourtEntity } from './entities/court.entity';
import { B2bFacilityEntity } from './entities/facility.entity';
import { B2bOrganizationEntity } from './entities/organization.entity';
import { B2bRoleEntity } from './entities/role.entity';
import { B2bShiftRuleEntity } from './entities/shift-rule.entity';
import { B2bShiftEntity } from './entities/shift.entity';
import { ShiftStatus } from './entities/b2b.enums';
import { B2bUserRoleEntity } from './entities/user-role.entity';
import { B2bUserEntity } from './entities/user.entity';
import { addOrgDays, addOrgHours, orgParts, orgTimeToDate, resolveTimeZone, startOfOrgDay } from './time';

@Injectable()
export class B2bSeedService implements OnModuleInit {
  private readonly logger = new Logger(B2bSeedService.name);

  constructor(
    @InjectRepository(B2bOrganizationEntity, 'b2b') private readonly organizations: Repository<B2bOrganizationEntity>,
    @InjectRepository(B2bRoleEntity, 'b2b') private readonly roles: Repository<B2bRoleEntity>,
    @InjectRepository(B2bUserEntity, 'b2b') private readonly users: Repository<B2bUserEntity>,
    @InjectRepository(B2bUserRoleEntity, 'b2b') private readonly userRoles: Repository<B2bUserRoleEntity>,
    @InjectRepository(B2bFacilityEntity, 'b2b') private readonly facilities: Repository<B2bFacilityEntity>,
    @InjectRepository(B2bCourtEntity, 'b2b') private readonly courts: Repository<B2bCourtEntity>,
    @InjectRepository(B2bShiftRuleEntity, 'b2b') private readonly rules: Repository<B2bShiftRuleEntity>,
    @InjectRepository(B2bShiftEntity, 'b2b') private readonly shifts: Repository<B2bShiftEntity>,
  ) {}

  async onModuleInit() {
    if (process.env.B2B_SEED !== 'true') return;
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('Seed B2B desactivado en producción: las credenciales demo no deben existir acá. Usá POST /api/v1/auth/onboarding para el alta inicial del propietario.');
      return;
    }
    const roleNames: Record<B2bRoleCode, string> = { OWNER: 'Propietario', ADMIN: 'Administrador', OPERATOR: 'Operador', CLIENT: 'Cliente' };
    await Promise.all(Object.entries(roleNames).map(([id, name]) => this.roles.upsert({ id: id as B2bRoleCode, name }, ['id'])));
    let organization = await this.organizations.findOne({ where: { slug: 'complejo-la-cancha' } });
    if (!organization) organization = await this.organizations.save(this.organizations.create({ name: 'Complejo La Cancha', slug: 'complejo-la-cancha' }));
    const email = process.env.B2B_SEED_EMAIL || 'admin@lacancha.com.ar';
    let user = await this.users.findOne({ where: { email, organizationId: organization.id } });
    if (!user) user = this.users.create({ organizationId: organization.id, email, fullName: 'Martín Palermo' });
    // Se actualiza el hash en cada arranque para que un cambio de B2B_SEED_PASSWORD en Render se aplique sin tocar la BD.
    user.passwordHash = await bcrypt.hash(process.env.B2B_SEED_PASSWORD || 'canchas-demo', 12);
    user = await this.users.save(user);
    await this.userRoles.upsert({ userId: user.id, organizationId: organization.id, roleId: B2bRoleCode.ADMIN }, ['userId', 'organizationId', 'roleId']);
    const admin2Email = process.env.B2B_SEED_ADMIN2_EMAIL || 'admin2@lacancha.com.ar';
    let admin2 = await this.users.findOne({ where: { email: admin2Email, organizationId: organization.id } });
    if (!admin2) admin2 = this.users.create({ organizationId: organization.id, email: admin2Email, fullName: 'Juan Román Riquelme' });
    admin2.passwordHash = await bcrypt.hash(process.env.B2B_SEED_ADMIN2_PASSWORD || 'canchas-admin2', 12);
    admin2 = await this.users.save(admin2);
    await this.userRoles.upsert({ userId: admin2.id, organizationId: organization.id, roleId: B2bRoleCode.ADMIN }, ['userId', 'organizationId', 'roleId']);
    const clientEmail = process.env.B2B_SEED_CLIENT_EMAIL || 'cliente@lacancha.com.ar';
    let client = await this.users.findOne({ where: { email: clientEmail, organizationId: organization.id } });
    if (!client) client = this.users.create({ organizationId: organization.id, email: clientEmail, fullName: 'Cliente Demo' });
    // Mismo criterio: mantener la contraseña del cliente demo sincronizada con B2B_SEED_CLIENT_PASSWORD.
    client.passwordHash = await bcrypt.hash(process.env.B2B_SEED_CLIENT_PASSWORD || 'canchas-client', 12);
    client = await this.users.save(client);
    await this.userRoles.upsert({ userId: client.id, organizationId: organization.id, roleId: B2bRoleCode.CLIENT }, ['userId', 'organizationId', 'roleId']);
    let facility = await this.facilities.findOne({ where: { organizationId: organization.id, name: 'Sede Central Palermo' } });
    if (!facility) facility = await this.facilities.save(this.facilities.create({ organizationId: organization.id, name: 'Sede Central Palermo', address: 'Buenos Aires, Argentina' }));
    const courts = [['Cancha 1', 'FUTBOL 5', 1800000], ['Cancha 2', 'FUTBOL 7', 2400000], ['Cancha 3', 'FUTBOL 8', 3200000]] as const;
    for (const [name, sportType, price] of courts) {
      let court = await this.courts.findOne({ where: { facilityId: facility.id, name } });
      if (!court) court = await this.courts.save(this.courts.create({ organizationId: organization.id, facilityId: facility.id, name, sportType, capacity: 10, defaultPriceCentsArs: price }));
      const count = await this.rules.count({ where: { courtId: court.id } });
      if (!count) await this.rules.save(this.rules.create({ courtId: court.id, weekday: 3, startTime: '18:00', endTime: '23:00', durationHours: 1, priceCentsArs: price }));
      const timezone = resolveTimeZone(organization.timezone);
      const today = startOfOrgDay(new Date(), timezone);
      for (let day = 0; day < 7; day += 1) {
        const dayStart = orgParts(addOrgDays(today, day, timezone), timezone);
        for (let hour = 18; hour < 23; hour += 1) {
          const startsAt = orgTimeToDate({ year: dayStart.year, month: dayStart.month, day: dayStart.day, hour, minute: 0 }, timezone);
          const endsAt = addOrgHours(startsAt, 1, timezone);
          const existingShift = await this.shifts.findOne({ where: { courtId: court.id, startsAt } });
          if (!existingShift) await this.shifts.save(this.shifts.create({ organizationId: organization.id, courtId: court.id, startsAt, endsAt, priceCentsArs: price, status: ShiftStatus.AVAILABLE }));
        }
      }
    }
    this.logger.log(`Seed B2B listo: ${organization.slug} / ${email} / admin2: ${admin2Email} / cliente: ${clientEmail}`);
  }
}