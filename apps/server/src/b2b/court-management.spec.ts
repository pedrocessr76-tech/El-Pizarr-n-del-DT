import { BadRequestException, NotFoundException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { B2bRoleCode } from './entities/b2b.enums';

// Alta y edición de canchas: tamaño, capacidad derivada y validación.
describe('Gestión de canchas', () => {
  const user = { userId: 'owner', organizationId: 'org', email: 'owner@test.invalid', roles: [B2bRoleCode.OWNER] };

  function setup() {
    const savedCourts: Array<Record<string, unknown>> = [];
    const facilities = { findOneBy: jest.fn().mockResolvedValue({ id: 'facility', organizationId: 'org' }) };
    const courts = {
      findOneBy: jest.fn(async ({ id }: { id: string }) =>
        savedCourts.find((court) => court.id === id) ?? null),
      create: jest.fn((row) => ({ id: 'court-' + (savedCourts.length + 1), ...row })),
      save: jest.fn(async (row) => {
        const index = savedCourts.findIndex((court) => court.id === row.id);
        if (index === -1) savedCourts.push(row);
        else savedCourts[index] = row;
        return row;
      }),
    };
    const rules = {
      create: jest.fn((row) => ({ id: 'rule', ...row })),
      save: jest.fn(async (rows) => rows),
      find: jest.fn(async () => []),
    };
    const shifts = {
      create: jest.fn((row) => ({ id: 'shift', ...row })),
      save: jest.fn(async (rows) => rows),
      findOne: jest.fn(async () => null),
    };
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue([]),
      notifyUser: jest.fn().mockResolvedValue([]),
      getUserDisplayName: jest.fn().mockResolvedValue('Cliente Test'),
    };
    const service = new B2bManagementService(
      {} as never, facilities as never, courts as never,
      rules as never, shifts as never, {} as never, {} as never, {} as never,
      {} as never,
      notifications as never,
    );
    return { service, courts, savedCourts };
  }

  it('deriva la capacidad según el tamaño (Fútbol 7 → 14)', async () => {
    const { service, savedCourts } = setup();
    const court = await service.createCourt(user, 'facility', { name: 'Cancha A', sportType: 'FUTBOL 7', defaultPriceCentsArs: 12000 });
    expect(court.capacity).toBe(14);
    expect(court.sportType).toBe('FUTBOL 7');
    expect(savedCourts[0].capacity).toBe(14);
  });

  it('deriva la capacidad según el tamaño (Fútbol 11 → 22)', async () => {
    const { service } = setup();
    const court = await service.createCourt(user, 'facility', { name: 'Cancha B', sportType: 'FUTBOL 11', defaultPriceCentsArs: 20000 });
    expect(court.capacity).toBe(22);
  });

  it('sin tamaño indicado, usa Fútbol 5 con capacidad 10', async () => {
    const { service } = setup();
    const court = await service.createCourt(user, 'facility', { name: 'Cancha C', defaultPriceCentsArs: 8000 });
    expect(court.sportType).toBe('FUTBOL 5');
    expect(court.capacity).toBe(10);
  });

  it('respeta una capacidad explícita en lugar de derivarla', async () => {
    const { service } = setup();
    const court = await service.createCourt(user, 'facility', { name: 'Cancha D', sportType: 'FUTBOL 11', capacity: 30, defaultPriceCentsArs: 20000 });
    expect(court.capacity).toBe(30);
  });

  it('rechaza con 400 un tamaño no admitido', async () => {
    const { service, courts, savedCourts } = setup();
    await expect(service.createCourt(user, 'facility', { name: 'Cancha X', sportType: 'FUTBOL 9', defaultPriceCentsArs: 10000 }))
      .rejects.toThrow(BadRequestException);
    expect(courts.save).not.toHaveBeenCalled();
    expect(savedCourts).toHaveLength(0);
  });

  it('no crea la cancha si el complejo no pertenece a la organización', async () => {
    const { courts } = setup();
    const otherFacilities = { findOneBy: jest.fn().mockResolvedValue(null) };
    const other = new B2bManagementService(
      {} as never, otherFacilities as never, courts as never,
      {} as never, {} as never, {} as never, {} as never, {} as never,
      {} as never,
      { notifyStaff: jest.fn(), notifyUser: jest.fn(), getUserDisplayName: jest.fn().mockResolvedValue('Cliente Test') } as never,
    );
    await expect(other.createCourt(user, 'facility', { name: 'Cancha Y', sportType: 'FUTBOL 5', defaultPriceCentsArs: 9000 }))
      .rejects.toThrow(NotFoundException);
  });

  it('updateCourt recalcula la capacidad cuando cambia el tamaño y no envía capacidad', async () => {
    const { service, savedCourts } = setup();
    await service.createCourt(user, 'facility', { name: 'Cancha E', sportType: 'FUTBOL 5', defaultPriceCentsArs: 9000 });
    const updated = await service.updateCourt(user, 'court-1', { sportType: 'FUTBOL 8' });
    expect(updated.capacity).toBe(16);
    expect(updated.sportType).toBe('FUTBOL 8');
    expect(savedCourts[0].capacity).toBe(16);
  });

  it('updateCourt respeta una capacidad explícita', async () => {
    const { service } = setup();
    await service.createCourt(user, 'facility', { name: 'Cancha F', sportType: 'FUTBOL 5', defaultPriceCentsArs: 9000 });
    const updated = await service.updateCourt(user, 'court-1', { sportType: 'FUTBOL 11', capacity: 50 });
    expect(updated.capacity).toBe(50);
  });

  it('updateCourt conserva la capacidad si no cambia el tamaño', async () => {
    const { service } = setup();
    await service.createCourt(user, 'facility', { name: 'Cancha G', sportType: 'FUTBOL 7', defaultPriceCentsArs: 12000 });
    const updated = await service.updateCourt(user, 'court-1', { name: 'Cancha G Renombrada' });
    expect(updated.capacity).toBe(14);
  });

  it('updateCourt rechaza con 400 un tamaño no admitido', async () => {
    const { service } = setup();
    await service.createCourt(user, 'facility', { name: 'Cancha H', sportType: 'FUTBOL 5', defaultPriceCentsArs: 9000 });
    await expect(service.updateCourt(user, 'court-1', { sportType: 'FUTBOL 3' })).rejects.toThrow(BadRequestException);
  });
});