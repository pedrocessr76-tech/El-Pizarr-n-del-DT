import { beforeEach, describe, expect, it, vi } from 'vitest';
import { b2bService, getB2bAccessToken, setB2bAccessToken } from './b2bService';

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
});