/**
 * Helpers de zona horaria de la organización (issue #24): los turnos se muestran
 * y se interpretan con el reloj de pared del complejo
 * (b2b_organizations.timezone), no con la zona del navegador.
 */

export const DEFAULT_ORG_TZ = 'America/Argentina/Buenos_Aires';

export interface OrgParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = domingo ... 6 = sábado
  hour: number; // 0-23
  minute: number;
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

export function isValidOrgTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function resolveOrgTimeZone(timeZone: string | null | undefined): string {
  return timeZone && isValidOrgTimeZone(timeZone) ? timeZone : DEFAULT_ORG_TZ;
}

function asDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Reloj de pared de un instante en la zona indicada. */
export function orgParts(value: string | number | Date, timeZone: string): OrgParts {
  const date = asDate(value);
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

/** Convierte un reloj de pared de la zona en el instante UTC correspondiente. */
export function orgTimeToDate(clock: { year: number; month: number; day: number; hour: number; minute: number }, timeZone: string): Date {
  const wanted = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
  let utc = wanted;
  for (let i = 0; i < 4; i += 1) {
    const parts = orgParts(new Date(utc), timeZone);
    const current = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const diff = current - wanted;
    if (diff === 0) break;
    utc -= diff;
  }
  return new Date(utc);
}

/** Inicio del día local (00:00) de la zona para el instante dado. */
export function startOfOrgDay(value: string | number | Date, timeZone: string): Date {
  const parts = orgParts(value, timeZone);
  return orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0 }, timeZone);
}

/** Suma días de calendario en la zona (conserva la misma hora de pared). */
export function addOrgDays(value: string | number | Date, days: number, timeZone: string): Date {
  const parts = orgParts(value, timeZone);
  return orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day + days, hour: parts.hour, minute: parts.minute }, timeZone);
}

/** Instante del mediodía local de una clave YYYY-MM-DD (evita bordes de DST). */
export function dayKeyToOrgDate(dayKey: string, timeZone: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return orgTimeToDate({ year, month, day, hour: 12, minute: 0 }, timeZone);
}

/** Instante de las 00:00 local de una clave YYYY-MM-DD. */
export function dayKeyToOrgMidnight(dayKey: string, timeZone: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return orgTimeToDate({ year, month, day, hour: 0, minute: 0 }, timeZone);
}

/** Clave YYYY-MM-DD del reloj de pared de la zona. */
export function toDayKey(timeZone: string, value: string | number | Date): string {
  const parts = orgParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

/** Día local de hoy en la zona. */
export function orgTodayKey(timeZone: string): string {
  return toDayKey(timeZone, new Date());
}

/** Key YYYY-MM-DD del lunes de la semana local en curso. */
export function startOfWeekKey(timeZone: string): string {
  const parts = orgParts(new Date(), timeZone);
  const daysFromMonday = (parts.weekday + 6) % 7;
  return toDayKey(timeZone, orgTimeToDate({ year: parts.year, month: parts.month, day: parts.day - daysFromMonday, hour: 12, minute: 0 }, timeZone));
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Etiqueta corta de la zona: "Buenos Aires (GMT-03:00)". */
export function orgTzLabel(timeZone: string): string {
  const date = new Date();
  // Ancla al minuto para comparar el reloj de pared (formateador) con el instante.
  const snapped = new Date(date.getTime() - (date.getSeconds() * 1000 + date.getMilliseconds()));
  const parts = orgParts(snapped, timeZone);
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offsetMinutes = Math.round((wallAsUtc - snapped.getTime()) / 60000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  const offset = `GMT${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  const short = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
  return `${short} (${offset})`;
}

export function formatHourLabel(timeZone: string, value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone });
}

export function formatDayLabel(timeZone: string, value: string | null | undefined): string {
  if (!value) return '—';
  const date = DAY_KEY.test(value) ? dayKeyToOrgDate(value, timeZone) : new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', timeZone });
}

export function formatWeekdayLabel(timeZone: string, value: string | Date): string {
  const date = typeof value === 'string' && DAY_KEY.test(value) ? dayKeyToOrgDate(value, timeZone) : new Date(value);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', timeZone });
}

/** Convierte el valor de un <input type="datetime-local"> (reloj de pared) al instante en la zona. */
export function orgLocalDateTimeToDate(timeZone: string, localValue: string): Date {
  const match = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})$/);
  if (!match) return new Date(Number.NaN);
  const [, year, month, day, hour, minute] = match.map(Number);
  return orgTimeToDate({ year, month, day, hour, minute }, timeZone);
}