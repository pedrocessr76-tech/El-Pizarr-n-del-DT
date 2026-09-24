import {
  isValidShiftDuration,
  isStaffRole,
  canChangeBookingStatus,
  canSendWhatsApp,
} from './domain-policy';
import { BookingStatus, B2bRoleCode } from './entities/b2b.enums';

describe('isValidShiftDuration', () => {
  it('acepta 1 hora', () => {
    expect(isValidShiftDuration(1)).toBe(true);
  });

  it('acepta 2 horas', () => {
    expect(isValidShiftDuration(2)).toBe(true);
  });

  it('rechaza 0 horas', () => {
    expect(isValidShiftDuration(0)).toBe(false);
  });

  it('rechaza 3 horas (MVP solo 1 o 2)', () => {
    expect(isValidShiftDuration(3)).toBe(false);
  });

  it('rechaza valores negativos', () => {
    expect(isValidShiftDuration(-1)).toBe(false);
  });

  it('rechaza 1.5 horas (solo enteros 1 o 2 permitidos)', () => {
    expect(isValidShiftDuration(1.5)).toBe(false);
  });
});

describe('isStaffRole', () => {
  it('OWNER es staff', () => {
    expect(isStaffRole(B2bRoleCode.OWNER)).toBe(true);
  });

  it('ADMIN es staff', () => {
    expect(isStaffRole(B2bRoleCode.ADMIN)).toBe(true);
  });

  it('OPERATOR es staff', () => {
    expect(isStaffRole(B2bRoleCode.OPERATOR)).toBe(true);
  });

  it('CLIENT no es staff', () => {
    expect(isStaffRole(B2bRoleCode.CLIENT)).toBe(false);
  });
});

describe('canChangeBookingStatus', () => {
  describe('client (isStaff=false) puede auto-gestionar', () => {
    it('PENDING → CANCELLED (cliente cancela su propia reserva)', () => {
      expect(canChangeBookingStatus(BookingStatus.PENDING, BookingStatus.CANCELLED, false)).toBe(true);
    });

    it('PENDING → COMPLETED (cliente confirma asistencia)', () => {
      expect(canChangeBookingStatus(BookingStatus.PENDING, BookingStatus.COMPLETED, false)).toBe(true);
    });

    it('NO_SHOW → CANCELLED no permitido (estado final)', () => {
      expect(canChangeBookingStatus(BookingStatus.NO_SHOW, BookingStatus.CANCELLED, false)).toBe(false);
    });

    it('COMPLETED → CANCELLED no permitido (estado final)', () => {
      expect(canChangeBookingStatus(BookingStatus.COMPLETED, BookingStatus.CANCELLED, false)).toBe(false);
    });

    it('CANCELLED → CONFIRMED no permitido (estado final)', () => {
      expect(canChangeBookingStatus(BookingStatus.CANCELLED, BookingStatus.CONFIRMED, false)).toBe(false);
    });
  });

  describe('staff (isStaff=true) puede todo menos reabrir', () => {
    it('PENDING → CONFIRMED (staff confirma)', () => {
      expect(canChangeBookingStatus(BookingStatus.PENDING, BookingStatus.CONFIRMED, true)).toBe(true);
    });

    it('PENDING → CANCELLED', () => {
      expect(canChangeBookingStatus(BookingStatus.PENDING, BookingStatus.CANCELLED, true)).toBe(true);
    });

    it('PENDING → NO_SHOW', () => {
      expect(canChangeBookingStatus(BookingStatus.PENDING, BookingStatus.NO_SHOW, true)).toBe(true);
    });

    it('CONFIRMED → COMPLETED', () => {
      expect(canChangeBookingStatus(BookingStatus.CONFIRMED, BookingStatus.COMPLETED, true)).toBe(true);
    });

    it('CONFIRMED → CANCELLED', () => {
      expect(canChangeBookingStatus(BookingStatus.CONFIRMED, BookingStatus.CANCELLED, true)).toBe(true);
    });

    it('CONFIRMED → NO_SHOW', () => {
      expect(canChangeBookingStatus(BookingStatus.CONFIRMED, BookingStatus.NO_SHOW, true)).toBe(true);
    });
  });

  describe('cliente no puede confirmar (CONFIRMED requiere staff)', () => {
    it('PENDING → CONFIRMED rechazado para cliente', () => {
      expect(canChangeBookingStatus(BookingStatus.PENDING, BookingStatus.CONFIRMED, false)).toBe(false);
    });
  });

  describe('estados terminales bloquean todo', () => {
    it('NO_SHOW → CONFIRMED rechazado', () => {
      expect(canChangeBookingStatus(BookingStatus.NO_SHOW, BookingStatus.CONFIRMED, true)).toBe(false);
    });

    it('COMPLETED → PENDING rechazado', () => {
      expect(canChangeBookingStatus(BookingStatus.COMPLETED, BookingStatus.PENDING, true)).toBe(false);
    });

    it('CANCELLED → CONFIRMED rechazado incluso para staff', () => {
      expect(canChangeBookingStatus(BookingStatus.CANCELLED, BookingStatus.CONFIRMED, true)).toBe(false);
    });
  });
});

describe('canSendWhatsApp (#37 - regla de consentimiento)', () => {
  it('devuelve true solo con teléfono E.164 y opt-in activo', () => {
    expect(canSendWhatsApp('+5491155551234', true)).toBe(true);
  });

  it('rechaza sin opt-in aunque haya teléfono', () => {
    expect(canSendWhatsApp('+5491155551234', false)).toBe(false);
  });

  it('rechaza sin teléfono (null o vacío) aunque haya opt-in', () => {
    expect(canSendWhatsApp(null, true)).toBe(false);
    expect(canSendWhatsApp(undefined, true)).toBe(false);
    expect(canSendWhatsApp('', true)).toBe(false);
  });
});
