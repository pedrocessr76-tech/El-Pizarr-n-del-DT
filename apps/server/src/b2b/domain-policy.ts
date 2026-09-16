import { BookingStatus, B2bRoleCode } from './entities/b2b.enums';

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