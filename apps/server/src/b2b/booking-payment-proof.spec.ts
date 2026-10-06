import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { B2bManagementService } from './b2b-management.service';
import { B2bBookingPaymentProofEntity } from './entities/booking-payment-proof.entity';
import { B2bRoleCode, BookingStatus } from './entities/b2b.enums';

describe('Comprobantes de pago de reservas', () => {
  const client = { userId: 'client-1', organizationId: 'org-1', email: 'client@example.com', roles: [B2bRoleCode.CLIENT] };
  const booking = {
    id: 'booking-1', organizationId: 'org-1', clientUserId: 'client-1', courtId: 'court-1', shiftId: 'shift-1', status: BookingStatus.CONFIRMED,
  };

  function setup() {
    let stored: Record<string, any> | null = null;
    const bookings = {
      findOne: jest.fn(async ({ where }: any) => where.id === booking.id && where.organizationId === booking.organizationId ? booking : null),
    };
    const paymentProofs = {
      find: jest.fn(async () => stored ? [stored] : []),
      findOne: jest.fn(async () => stored),
      create: jest.fn((row) => ({ ...row })),
      save: jest.fn(async (row) => { stored = { id: 'proof-1', uploadedAt: new Date(), ...row }; return stored; }),
    };
    const users = { findOne: jest.fn(async () => ({ id: 'client-1', email: 'client@example.com', fullName: 'Cliente Demo' })) };
    const courts = { findOne: jest.fn(async () => ({ id: 'court-1', name: 'Cancha Norte' })) };
    const shifts = { findOne: jest.fn(async () => ({ id: 'shift-1', startsAt: new Date('2030-01-01T20:00:00Z') })) };
    const organizations = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'org-1', timezone: 'America/Argentina/Buenos_Aires' }) };
    const notifications = {
      notifyStaff: jest.fn().mockResolvedValue({ payloads: [], saved: [] }),
      notifyUser: jest.fn().mockResolvedValue({ payloads: [], saved: [] }),
    };
    const messaging = { sendEmail: jest.fn().mockResolvedValue({ delivered: true, provider: 'smtp', messageId: 'mail-1' }) };
    const service = new B2bManagementService(
      organizations as never, {} as never, courts as never, {} as never, shifts as never, {} as never,
      bookings as never, {} as never, users as never, notifications as never,
      {} as never, messaging as never, paymentProofs as never,
    );
    return { service, bookings, paymentProofs, notifications, messaging, getStored: () => stored };
  }

  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validInput = {
    paymentType: 'DEPOSIT' as const,
    paymentMethod: 'TRANSFER' as const,
    fileName: '..\\recibo.png',
    contentType: 'image/png',
    fileData: png,
  };

  it('guarda el archivo, modalidad y método en la reserva propia', async () => {
    const { service, notifications, getStored } = setup();

    const result = await service.uploadBookingPaymentProof(client, booking.id, validInput);

    expect(result).toEqual(expect.objectContaining({ bookingId: booking.id, paymentType: 'DEPOSIT', paymentMethod: 'TRANSFER', fileName: '.._recibo.png' }));
    expect(getStored()?.fileData).toEqual(png);
    expect(notifications.notifyStaff).toHaveBeenCalledWith('org-1', expect.objectContaining({ type: 'b2b_booking_payment_proof' }), 'client-1');
  });

  it('no permite subir comprobantes para reservas ajenas o canceladas', async () => {
    const { service, bookings } = setup();
    bookings.findOne.mockResolvedValueOnce(null);
    await expect(service.uploadBookingPaymentProof({ ...client, userId: 'other' }, booking.id, validInput)).rejects.toBeInstanceOf(NotFoundException);
    bookings.findOne.mockResolvedValueOnce({ ...booking, status: BookingStatus.CANCELLED } as never);
    await expect(service.uploadBookingPaymentProof(client, booking.id, validInput)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza formato que no coincide con la firma o archivo mayor a 5 MB', async () => {
    const { service } = setup();
    await expect(service.uploadBookingPaymentProof(client, booking.id, { ...validInput, contentType: 'application/pdf' }))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.uploadBookingPaymentProof(client, booking.id, { ...validInput, fileData: Buffer.alloc(5 * 1024 * 1024 + 1) }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('solo permite consultar el comprobante a la persona titular o al staff de la organización', async () => {
    const { service, getStored } = setup();
    await service.uploadBookingPaymentProof(client, booking.id, validInput);
    expect((await service.getBookingPaymentProof(client, booking.id))?.dataBase64).toBe(png.toString('base64'));
    await expect(service.getBookingPaymentProof({ ...client, userId: 'other' }, booking.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(getStored()?.fileName).toBe('.._recibo.png');
  });

  it('envía recordatorio por email e in-app solo desde una cuenta staff', async () => {
    const { service, messaging, notifications } = setup();

    await expect(service.sendBookingPaymentReminder({ ...client, roles: [B2bRoleCode.ADMIN] }, booking.id))
      .resolves.toEqual({ delivered: true, provider: 'smtp' });
    expect(messaging.sendEmail).toHaveBeenCalledWith(
      'client@example.com',
      expect.stringContaining('adjuntar el comprobante'),
      'Recordatorio de pago de reserva',
      'payment',
      { bookingId: booking.id },
    );
    expect(notifications.notifyUser).toHaveBeenCalledWith('client-1', 'org-1', expect.objectContaining({ title: 'Recordatorio de pago' }), expect.any(String));
    await expect(service.sendBookingPaymentReminder(client, booking.id)).rejects.toBeInstanceOf(ForbiddenException);
  });
});