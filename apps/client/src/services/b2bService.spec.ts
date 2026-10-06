import { beforeEach, describe, expect, it, vi } from 'vitest';
import { b2bService, buildWhatsAppDeepLink, getB2bAccessToken, setB2bAccessToken } from './b2bService';

const harness = vi.hoisted(() => {
  const make = () => {
    const inst: any = Object.assign(vi.fn(), {
      defaults: {},
      headers: {},
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      // El import por defecto de axios puede resolverse como namespace o como
      // valor por defecto según el interop; cubrimos ambas formas.
      create: vi.fn(() => inst),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    });
    return inst;
  };
  const main = make();
  return { make, main };
});

vi.mock('axios', () => ({ default: harness.main, create: harness.main.create }));

const { main } = harness;

const BOOKING = {
  id: 'bk-1',
  courtId: 'court-1',
  shiftId: 'shift-1',
  clientUserId: 'u-1',
  status: 'CONFIRMED',
  priceCentsArs: 15000,
};

// Handlers reales registrados por b2bService al importarse.
const requestHandler = (main.interceptors.request.use as ReturnType<typeof vi.fn>).mock.calls[0][0];
const responseErrHandler = (main.interceptors.response.use as ReturnType<typeof vi.fn>).mock.calls[0][1];

beforeEach(() => {
  setB2bAccessToken(null);
  main.post.mockReset();
  main.get.mockReset();
  main.patch.mockReset();
  main.put.mockReset();
  main.delete.mockReset();
  main.mockReset();
});

describe('b2bService: flujo reserva / cancelación / reprogramación', () => {
  it('createBooking hace POST /v1/bookings con courtId, shiftId y notas', async () => {
    main.post.mockResolvedValue({ data: BOOKING });

    const booking = await b2bService.createBooking({ courtId: 'court-1', shiftId: 'shift-1', notes: 'Techo' });

    expect(main.post).toHaveBeenCalledWith('/v1/bookings', { courtId: 'court-1', shiftId: 'shift-1', notes: 'Techo' });
    expect(booking).toEqual(BOOKING);
  });

  it('cancelBooking hace POST /v1/bookings/{id}/cancel', async () => {
    main.post.mockResolvedValue({ data: { ...BOOKING, status: 'CANCELLED' } });

    const booking = await b2bService.cancelBooking('bk-1');

    expect(main.post).toHaveBeenCalledWith('/v1/bookings/bk-1/cancel');
    expect(booking.status).toBe('CANCELLED');
  });

  it('rescheduleBooking reprograma contra un turno nuevo', async () => {
    main.post.mockResolvedValue({ data: { ...BOOKING, shiftId: 'shift-2' } });

    const booking = await b2bService.rescheduleBooking('bk-1', 'shift-2');

    expect(main.post).toHaveBeenCalledWith('/v1/bookings/bk-1/reschedule', { shiftId: 'shift-2' });
    expect(booking.shiftId).toBe('shift-2');
  });

  it('confirmBooking y completeBooking usan sus endpoints', async () => {
    main.post.mockResolvedValue({ data: BOOKING });

    await b2bService.confirmBooking('bk-1');
    await b2bService.completeBooking('bk-1');

    expect(main.post).toHaveBeenCalledWith('/v1/bookings/bk-1/confirm');
    expect(main.post).toHaveBeenCalledWith('/v1/bookings/bk-1/complete');
  });

  it('la validación del backend (409 turno ocupado) llega al caller como rechazo', async () => {
    const conflict = { response: { status: 409, data: { message: 'El turno ya fue reservado.' } } };
    main.post.mockRejectedValue(conflict);

    await expect(b2bService.createBooking({ courtId: 'court-1', shiftId: 'shift-1' })).rejects.toEqual(conflict);
  });

  it('el interceptor agrega el Bearer del token en memoria', () => {
    setB2bAccessToken('tok-b2b');
    const config: Record<string, unknown> = { headers: {} };

    requestHandler(config);

    expect((config.headers as Record<string, string>).Authorization).toBe('Bearer tok-b2b');
  });

  it('un 401 renueva el token con coalescing y reintenta la petición original', async () => {
    main.post.mockResolvedValueOnce({ data: { accessToken: 'nuevo-token', user: { userId: 'u1', organizationId: 'o1', email: 'a@b.c', roles: [] } } });
    const original = { headers: {}, method: 'post', url: '/v1/bookings' };
    const httpError = { response: { status: 401 }, config: original };

    const retried = await responseErrHandler(httpError);

    expect(main.post).toHaveBeenCalledWith('/v1/auth/refresh');
    expect(getB2bAccessToken()).toBe('nuevo-token');
    expect(retried).toBeUndefined();
    expect(main).toHaveBeenCalledWith(expect.objectContaining({ headers: { Authorization: 'Bearer nuevo-token' } }));
  });

  it('si el refresh falla, limpia el token y rechaza el error original', async () => {
    main.post.mockRejectedValueOnce(new Error('refresh fail'));
    const original = { headers: {} };
    const httpError = { response: { status: 401 }, config: original };

    await expect(responseErrHandler(httpError)).rejects.toEqual(httpError);

    expect(getB2bAccessToken()).toBeNull();
  });

  it('un 401 en /v1/auth/refresh no reentra al refresh (evita deadlock del hydrate)', async () => {
    const original = { headers: {}, url: '/v1/auth/refresh' };
    const httpError = { response: { status: 401 }, config: original };

    await expect(responseErrHandler(httpError)).rejects.toEqual(httpError);

    expect(main.post).not.toHaveBeenCalled();
  });
});

describe('b2bService: recordatorios bicanal (#34)', () => {
  it('guarda las anticipaciones de email y WhatsApp en una sola llamada', async () => {
    main.patch.mockResolvedValueOnce({ data: { id: 'org-1', emailReminderIntervalsMinutes: [1440], whatsappReminderIntervalsMinutes: [30] } });

    const saved = await b2bService.updateOrganizationReminderIntervals({
      emailReminderIntervalsMinutes: [1440],
      whatsappReminderIntervalsMinutes: [30, 15],
    });

    expect(main.patch).toHaveBeenCalledWith('/v1/organizations/me', {
      emailReminderIntervalsMinutes: [1440],
      whatsappReminderIntervalsMinutes: [30, 15],
    });
    expect(saved.emailReminderIntervalsMinutes).toEqual([1440]);
  });

  it('solo envía las listas que se modificaron, sin pisar el otro canal', async () => {
    main.patch.mockResolvedValueOnce({ data: { id: 'org-1' } });

    await b2bService.updateOrganizationReminderIntervals({ emailReminderIntervalsMinutes: [] });

    expect(main.patch).toHaveBeenCalledWith('/v1/organizations/me', { emailReminderIntervalsMinutes: [] });
  });

  it('trae los avisos de WhatsApp pendientes de despacho', async () => {
    const alerts = [{ reminderId: 'rem-1', bookingId: 'b1' }];
    main.get.mockResolvedValueOnce({ data: alerts });

    await expect(b2bService.getPendingWhatsAppAlerts()).resolves.toEqual(alerts);
    expect(main.get).toHaveBeenCalledWith('/v1/reminders/pending');
  });

  it('confirma el despacho manual de un aviso', async () => {
    main.post.mockResolvedValueOnce({ data: { dispatched: true } });

    await expect(b2bService.markWhatsAppAlertDispatched('rem-1')).resolves.toEqual({ dispatched: true });
    expect(main.post).toHaveBeenCalledWith('/v1/reminders/rem-1/sent');
  });

  it('escapa el identificador del aviso en la URL', async () => {
    main.post.mockResolvedValueOnce({ data: { dispatched: true } });

    await b2bService.markWhatsAppAlertDispatched('rem 1/../x');

    expect(main.post).toHaveBeenCalledWith('/v1/reminders/rem%201%2F..%2Fx/sent');
  });
});

describe('b2bService: verificación de email (#verificacion-de-email)', () => {
  it('verifyEmail canjea el token contra el endpoint de verificación', async () => {
    main.post.mockResolvedValueOnce({ data: { verified: true, message: 'Email verificado. Ya podés entrar.' } });

    const result = await b2bService.verifyEmail('tok-abc');

    expect(main.post).toHaveBeenCalledWith('/v1/auth/verify-email', { token: 'tok-abc' });
    expect(result.verified).toBe(true);
  });

  it('verifyEmail propaga el 4xx del servidor para que la pantalla muestre el motivo', async () => {
    const expired = { response: { status: 400, data: { message: 'El enlace venció.' } } };
    main.post.mockRejectedValueOnce(expired);

    await expect(b2bService.verifyEmail('viejo')).rejects.toEqual(expired);
  });

  it('resendVerification pide un enlace nuevo con el email en el body', async () => {
    main.post.mockResolvedValueOnce({ data: { message: 'Si la cuenta existe, te enviamos un enlace nuevo.' } });

    const result = await b2bService.resendVerification('ana@club.com');

    expect(main.post).toHaveBeenCalledWith('/v1/auth/resend-verification', { email: 'ana@club.com' });
    expect(result.message).toContain('existe');
  });

  it('el registro y el onboarding devuelven la cuenta pendiente, no una sesión', async () => {
    main.post.mockResolvedValueOnce({ data: { email: 'ana@club.com', emailVerified: false, message: 'Revisá tu email.' } });

    const result = await b2bService.registerClient({ email: 'ana@club.com', fullName: 'Ana', password: '123456' });

    expect(main.post).toHaveBeenCalledWith('/v1/auth/register-client', { email: 'ana@club.com', fullName: 'Ana', password: '123456' });
    // Sin accessToken: una cuenta sin verificar no debe podersesionarse.
    expect((result as unknown as Record<string, unknown>).accessToken).toBeUndefined();
    expect('emailVerified' in result && result.emailVerified).toBe(false);
  });

  it('onboardOwner también queda pendiente de verificación', async () => {
    main.post.mockResolvedValueOnce({ data: { email: 'owner@club.com', emailVerified: false, message: 'Revisá tu email.' } });

    const result = await b2bService.onboardOwner({ organizationName: 'Los Amigos', ownerFullName: 'Ana', email: 'owner@club.com', password: '123456' });

    expect(main.post).toHaveBeenCalledWith('/v1/auth/onboarding', {
      organizationName: 'Los Amigos',
      ownerFullName: 'Ana',
      email: 'owner@club.com',
      password: '123456',
    });
    expect((result as unknown as Record<string, unknown>).accessToken).toBeUndefined();
  });
});

describe('buildWhatsAppDeepLink', () => {
  it('arma el enlace con el teléfono en E.164 y el mensaje precargado', () => {
    expect(buildWhatsAppDeepLink('+54 9 11 5555-1234', 'Hola Ana')).toBe('https://wa.me/5491155551234?text=Hola%20Ana');
  });

  it('descarta cualquier carácter que no sea dígito', () => {
    expect(buildWhatsAppDeepLink('(011) 15-5555-1234', 'x')).toContain('https://wa.me/0111555551234?text=x');
  });
});

describe('b2bService: reglas y generación mensual de turnos', () => {
  it('elimina una regla del día y la cancha seleccionados', async () => {
    main.delete.mockResolvedValue({ data: { deleted: true } });

    await b2bService.deleteShiftRule('court-1', 'rule-7');

    expect(main.delete).toHaveBeenCalledWith('/v1/courts/court-1/shift-rules/rule-7');
  });

  it('genera el mes completo sin pedir rango de fechas', async () => {
    main.post.mockResolvedValue({ data: [{ id: 'shift-1' }] });

    const result = await b2bService.generateMonthlyShifts('court-1');

    expect(main.post).toHaveBeenCalledWith('/v1/courts/court-1/shifts/generate-month');
    expect(result).toEqual([{ id: 'shift-1' }]);
  });
});

describe('b2bService: administración de canchas', () => {
  it('actualiza nombre, tipo, capacidad y precio de una cancha', async () => {
    const patch = { name: 'Cancha Norte', sportType: 'FUTBOL 7', capacity: 14, defaultPriceCentsArs: 2200000 };
    main.patch.mockResolvedValue({ data: { id: 'court-1', ...patch } });

    await b2bService.updateCourt('court-1', patch);

    expect(main.patch).toHaveBeenCalledWith('/v1/courts/court-1', patch);
  });

  it('elimina una cancha mediante el endpoint protegido de archivo lógico', async () => {
    main.delete.mockResolvedValue({ data: { id: 'court-1', status: 'INACTIVE' } });

    const result = await b2bService.deleteCourt('court-1');

    expect(main.delete).toHaveBeenCalledWith('/v1/courts/court-1');
    expect(result.status).toBe('INACTIVE');
  });
});

describe('b2bService: chat de jugador pivote', () => {
  it('crea una solicitud que devuelve el id de conversación', async () => {
    main.post.mockResolvedValue({ data: { sent: true, conversationId: 'request-1' } });

    const result = await b2bService.contactPivot('pivot/1', 'booking-1', '¿Podés jugar?');

    expect(main.post).toHaveBeenCalledWith('/v1/pivots/pivot%2F1/contact', { bookingId: 'booking-1', message: '¿Podés jugar?' });
    expect(result.conversationId).toBe('request-1');
  });

  it('lee el historial y envía mensajes por endpoints de la conversación', async () => {
    main.get.mockResolvedValue({ data: { id: 'request-1', isPivot: true, messages: [] } });
    main.post.mockResolvedValue({ data: { id: 'message-1', conversationId: 'request-1', senderUserId: 'u1', body: 'Hola', createdAt: '2030-01-01T12:00:00Z' } });

    const chat = await b2bService.getPivotChat('request-1');
    const message = await b2bService.sendPivotChatMessage('request-1', 'Hola');

    expect(main.get).toHaveBeenCalledWith('/v1/pivots/chats/request-1');
    expect(main.post).toHaveBeenCalledWith('/v1/pivots/chats/request-1/messages', { body: 'Hola' });
    expect(chat.isPivot).toBe(true);
    expect(message.body).toBe('Hola');
  });

  it('lista solicitudes propias y responde voy/no voy', async () => {
    main.get.mockResolvedValue({ data: [] });
    main.patch.mockResolvedValue({ data: { id: 'request-1', status: 'ACCEPTED', respondedAt: '2030-01-01T12:00:00Z' } });

    await b2bService.getPivotRequests();
    await b2bService.respondToPivotRequest('request-1', 'ACCEPTED');

    expect(main.get).toHaveBeenCalledWith('/v1/pivots/requests');
    expect(main.patch).toHaveBeenCalledWith('/v1/pivots/requests/request-1/response', { decision: 'ACCEPTED' });
  });
});

describe('b2bService: comprobante y recordatorio de pago', () => {
  it('sube el comprobante con modalidad y medio de pago', async () => {
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'recibo.png', { type: 'image/png' });
    main.post.mockResolvedValue({ data: {
      paymentType: 'DEPOSIT', paymentMethod: 'TRANSFER', fileName: 'recibo.png',
      contentType: 'image/png', uploadedAt: '2030-01-01T12:00:00Z',
    } });

    await b2bService.uploadBookingPaymentProof('booking-1', { paymentType: 'DEPOSIT', paymentMethod: 'TRANSFER', file });

    const [url, form] = main.post.mock.calls[0];
    expect(url).toBe('/v1/bookings/booking-1/payment-proof');
    expect(form.get('paymentType')).toBe('DEPOSIT');
    expect(form.get('paymentMethod')).toBe('TRANSFER');
    expect(form.get('file')).toBeInstanceOf(File);
  });

  it('lee el comprobante propio y permite al admin enviar recordatorio', async () => {
    main.get.mockResolvedValue({ data: null });
    main.post.mockResolvedValue({ data: { delivered: true, provider: 'smtp' } });

    await b2bService.getBookingPaymentProof('booking-1');
    await b2bService.sendBookingPaymentReminder('booking-1');

    expect(main.get).toHaveBeenCalledWith('/v1/bookings/booking-1/payment-proof');
    expect(main.post).toHaveBeenCalledWith('/v1/bookings/booking-1/payment-reminder');
  });
});