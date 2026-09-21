import { ConflictException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { B2bRoleCode, ShiftStatus } from './entities/b2b.enums';
import { B2bShiftEntity } from './entities/shift.entity';
import { B2bAvailabilityBlockEntity } from './entities/availability-block.entity';

// Ejecuta el servicio real con repositorios simulados; no sustituye una prueba PostgreSQL.
describe('Horarios y bloqueos', () => {
  const user = { userId: 'owner', organizationId: 'org', email: 'owner@test.invalid', roles: [B2bRoleCode.OWNER] };
  function setup() {
    const generated: B2bShiftEntity[] = [];
    const savedBlocks: B2bAvailabilityBlockEntity[] = [];
    const courts = { findOneBy: jest.fn().mockResolvedValue({ id: 'court', organizationId: 'org' }) };
    const rules = { find: jest.fn().mockResolvedValue([{ weekday: 1, startTime: '10:00', durationHours: 1, priceCentsArs: 10000 }]) };
    const shifts = {
      create: jest.fn((row) => ({ id: 'shift', ...row })),
      save: jest.fn(async (rows) => { generated.push(...rows); return rows; }),
      findOne: jest.fn(async () => generated[0] ?? null),
      find: jest.fn(async () => generated),
    };
    const blocks = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => { savedBlocks.push(row); return row; }),
      find: jest.fn(async () => savedBlocks),
    };
    const bookings = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn(), create: jest.fn() };
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue([]),
      notifyUser: jest.fn().mockResolvedValue([]),
      getUserDisplayName: jest.fn().mockResolvedValue('Cliente Test'),
    };
    const service = new B2bManagementService(
      {} as never, {} as never, courts as never, rules as never,
      shifts as never, blocks as never, bookings as never, {} as never,
      notifications as never,
    );
    return { service, shifts, blocks, bookings, generated, notifications };
  }

  it('excluye un turno generado después de bloquearlo y rechaza reservarlo', async () => {
    const { service, bookings } = setup();
    const from = new Date(2030, 0, 7, 0).toISOString(); // lunes, zona local del servidor
    const to = new Date(2030, 0, 8, 0).toISOString();
    const [shift] = await service.generateShifts(user, 'court', { from, to });
    expect(shift.status).toBe(ShiftStatus.AVAILABLE);
    expect(await service.availability(user, 'court', from, to)).toHaveLength(1);
    await service.createBlock(user, 'court', {
      startsAt: shift.startsAt.toISOString(), endsAt: shift.endsAt.toISOString(), reason: 'Mantenimiento',
    });
    expect(await service.availability(user, 'court', from, to)).toEqual([]);
    await expect(service.createBooking(user, { courtId: 'court', shiftId: shift.id })).rejects.toThrow(ConflictException);
    expect(bookings.save).not.toHaveBeenCalled();
  });

  it('createBooking rechaza directamente un turno bloqueado antes de cualquier escritura', async () => {
    const { service, generated, blocks, bookings, shifts } = setup();
    generated.push({
      id: 'shift', organizationId: 'org', courtId: 'court',
      startsAt: new Date('2030-01-07T13:00:00Z'),
      endsAt: new Date('2030-01-07T14:00:00Z'),
      status: ShiftStatus.AVAILABLE, priceCentsArs: 10000,
    } as B2bShiftEntity);
    blocks.find.mockResolvedValue([{
      organizationId: 'org', courtId: 'court',
      startsAt: new Date('2030-01-07T13:30:00Z'),
      endsAt: new Date('2030-01-07T14:30:00Z'),
    } as B2bAvailabilityBlockEntity]);

    await expect(service.createBooking(user, { courtId: 'court', shiftId: 'shift' }))
      .rejects.toThrow(new ConflictException('El turno está bloqueado'));

    expect(blocks.find).toHaveBeenCalledWith({ where: { organizationId: 'org', courtId: 'court' } });
    expect(bookings.create).not.toHaveBeenCalled();
    expect(bookings.save).not.toHaveBeenCalled();
    expect(shifts.save).not.toHaveBeenCalled();
    expect(generated[0].status).toBe(ShiftStatus.AVAILABLE);
  });

  it('un bloqueo contiguo no oculta el turno (intervalos semiabiertos)', async () => {
    const { service } = setup();
    const from = new Date(2030, 0, 7, 0).toISOString();
    const to = new Date(2030, 0, 8, 0).toISOString();
    const [shift] = await service.generateShifts(user, 'court', { from, to });
    await service.createBlock(user, 'court', {
      startsAt: shift.endsAt.toISOString(),
      endsAt: new Date(shift.endsAt.getTime() + 3600000).toISOString(), reason: 'Contiguo',
    });
    expect(await service.availability(user, 'court', from, to)).toHaveLength(1);
  });
});
