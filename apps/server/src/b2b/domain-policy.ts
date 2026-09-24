import { BookingStatus, B2bRoleCode } from './entities/b2b.enums';

export const B2B_COURT_SIZES = ['FUTBOL 5', 'FUTBOL 7', 'FUTBOL 8', 'FUTBOL 11'] as const;

export type B2bCourtSize = (typeof B2B_COURT_SIZES)[number];

export function isValidCourtSize(sportType: string): sportType is B2bCourtSize {
  return (B2B_COURT_SIZES as readonly string[]).includes(sportType);
}

export function deriveCourtCapacity(sportType: B2bCourtSize | string | undefined): number {
  switch (sportType) {
    case 'FUTBOL 5': return 10;
    case 'FUTBOL 7': return 14;
    case 'FUTBOL 8': return 16;
    case 'FUTBOL 11': return 22;
    default: return 10;
  }
}

export function isValidShiftDuration(durationHours: number): durationHours is 1 | 2 {
  return durationHours === 1 || durationHours === 2;
}

export function isStaffRole(role: B2bRoleCode): boolean {
  return [B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR].includes(role);
}

export function canChangeBookingStatus(current: BookingStatus, next: BookingStatus, isStaff: boolean): boolean {
  // Estados terminales: no se puede transitar desde ellos.
  if (current === BookingStatus.CANCELLED || current === BookingStatus.COMPLETED || current === BookingStatus.NO_SHOW) return false;
  if (next === BookingStatus.CONFIRMED && !isStaff) return false;
  return [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(next);
}

/**
 * Regla de consentimiento para envíos de WhatsApp (#37): solo cuando hay un
 * teléfono E.164 configurado Y el opt-in está activo. Es la única puerta de
 * salida; los consumidores (recordatorios, confirmaciones, resumen) la deben
 * consultar antes de llamar a MessagingService.
 */
export function canSendWhatsApp(phone: string | null | undefined, optIn: boolean): phone is string {
  return typeof phone === 'string' && phone.length > 0 && optIn;
}