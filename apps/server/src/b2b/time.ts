/**
 * Manejo centralizado de la zona horaria de la organización (issue #24).
 * Todas las conversiones de turnos usan el reloj de pared de
 * b2b_organizations.timezone, nunca la zona del proceso del servidor: así el
 * corrimiento de horarios no depende de la región donde se despliegue la API.
 */

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

export interface OrgParts extends WallClock {
  weekday: number; // 0 = domingo ... 6 = sábado
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatterCache.set(timeZone, fmt);
  }
  return fmt;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Devuelve la zona indicada si es válida; si no, la predeterminada. */
export function resolveTimeZone(timeZone: string | null | undefined): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
}

/** Reloj de pared de un instante en la zona indicada. */
export function orgParts(date: Date, timeZone: string): OrgParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

function wallClockAsUtc(clock: OrgParts): number {
  return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
}

/**
 * Convierte un reloj de pared de la zona en el instante UTC correspondiente.
 * Itera restando el desplazamiento observado hasta que el reloj de pared de la
 * zona coincide con el objetivo (suele alcanzarse en una iteración).
 */
export function orgTimeToDate(clock: WallClock, timeZone: string): Date {
  const wanted = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
  let utc = wanted;
  for (let i = 0; i < 4; i += 1) {
    const current = wallClockAsUtc(orgParts(new Date(utc), timeZone));
    const diff = current - wanted;
    if (diff === 0) break;
    utc -= diff;
  }
  return new Date(utc);
}

/** Inicio del día local (00:00) de la zona para el instante dado. */
export function startOfOrgDay(date: Date, timeZone: string): Date {
  const parts = orgParts(date, timeZone);
  return orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0 }, timeZone);
}

/** Suma días de calendario en la zona (conserva la misma hora de pared). */
export function addOrgDays(date: Date, days: number, timeZone: string): Date {
  const parts = orgParts(date, timeZone);
  return orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day + days, hour: parts.hour, minute: parts.minute }, timeZone);
}

/** Suma horas de pared en la zona (maneja el cruce de día y cambios de horario). */
export function addOrgHours(date: Date, hours: number, timeZone: string): Date {
  const parts = orgParts(date, timeZone);
  return orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day, hour: parts.hour + hours, minute: parts.minute }, timeZone);
}

/** Fecha del instante en la zona, formato DD/MM/YYYY (notificaciones). */
export function orgDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone }).format(date);
}

/** Hora del instante en la zona, formato HH:mm (notificaciones). */
export function orgTimeString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(date);
}