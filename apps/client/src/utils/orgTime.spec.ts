import {
  DEFAULT_ORG_TZ,
  addOrgDays,
  dayKeyToOrgDate,
  formatDayLabel,
  formatHourLabel,
  formatWeekdayLabel,
  isValidOrgTimeZone,
  orgLocalDateTimeToDate,
  orgParts,
  orgTimeToDate,
  orgTodayKey,
  orgTzLabel,
  resolveOrgTimeZone,
  startOfOrgDay,
  startOfWeekKey,
  toDayKey,
} from './orgTime';

const BA = 'America/Argentina/Buenos_Aires'; // UTC-3 fijo (sin DST)
const TOKYO = 'Asia/Tokyo'; // UTC+9

describe('Zona horaria de la organización en el cliente (issue #24)', () => {
  it('orgParts y orgTimeToDate leen el reloj de pared de la zona', () => {
    const parts = orgParts(new Date('2030-01-07T13:00:00Z'), BA);
    expect(parts).toEqual({ year: 2030, month: 1, day: 7, weekday: 1, hour: 10, minute: 0 });
    expect(orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, BA).toISOString()).toBe('2030-01-07T13:00:00.000Z');
    expect(orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, TOKYO).toISOString()).toBe('2030-01-07T01:00:00.000Z');
  });

  it('toDayKey agrupa por el día local de la zona', () => {
    const instant = '2030-01-07T15:00:00Z';
    expect(toDayKey(BA, instant)).toBe('2030-01-07');
    expect(toDayKey(TOKYO, instant)).toBe('2030-01-08');
  });

  it('startOfOrgDay y addOrgDays mantienen el calendario local', () => {
    const monday = startOfOrgDay(new Date('2030-01-07T12:00:00Z'), BA);
    expect(monday.toISOString()).toBe('2030-01-07T03:00:00.000Z');
    expect(addOrgDays(monday, 7, BA).toISOString()).toBe('2030-01-14T03:00:00.000Z');
  });

  it('dayKeyToOrgDate mapea una clave YYYY-MM-DD al mediodía local (estable ante DST)', () => {
    expect(dayKeyToOrgDate('2030-01-07', BA).toISOString()).toBe('2030-01-07T15:00:00.000Z');
  });

  it('orgLocalDateTimeToDate interpreta un datetime-local en el reloj de pared de la zona', () => {
    const date = orgLocalDateTimeToDate(BA, '2030-01-07T10:00');
    expect(date.toISOString()).toBe('2030-01-07T13:00:00.000Z');
    expect(Number.isNaN(orgLocalDateTimeToDate(BA, 'fecha inválida').valueOf())).toBe(true);
  });

  it('los formateadores usan la zona de la organización', () => {
    expect(formatHourLabel(BA, '2030-01-07T13:00:00Z')).toContain('10:00');
    expect(formatDayLabel(BA, '2030-01-07')).toContain('07');
    expect(formatDayLabel(BA, '2030-01-07')).toContain('ene');
    expect(formatDayLabel(BA, null)).toBe('—');
    expect(formatWeekdayLabel(TOKYO, '2030-01-08')).toContain('mar');
    expect(formatWeekdayLabel(TOKYO, '2030-01-08')).toContain('08');
  });

  it('resolveOrgTimeZone valida y cae a la predeterminada', () => {
    expect(resolveOrgTimeZone('America/Argentina/Buenos_Aires')).toBe('America/Argentina/Buenos_Aires');
    expect(resolveOrgTimeZone('No/Existe')).toBe(DEFAULT_ORG_TZ);
    expect(resolveOrgTimeZone(undefined)).toBe(DEFAULT_ORG_TZ);
    expect(isValidOrgTimeZone('Asia/Tokyo')).toBe(true);
    expect(isValidOrgTimeZone('Basura')).toBe(false);
  });

  it('orgTzLabel y la semana local describen la zona', () => {
    expect(orgTzLabel(BA)).toContain('GMT-03:00');
    expect(orgTzLabel(BA)).toContain('Buenos Aires');
    expect(startOfWeekKey(BA)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(orgTodayKey(BA)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});