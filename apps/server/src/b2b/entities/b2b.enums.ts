export enum B2bRoleCode {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  CLIENT = 'CLIENT',
}

export enum B2bRecordStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ShiftStatus {
  AVAILABLE = 'AVAILABLE',
  BLOCKED = 'BLOCKED',
  BOOKED = 'BOOKED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}