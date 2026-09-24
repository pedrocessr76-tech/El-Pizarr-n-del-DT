import { addOrgDays, addOrgHours, DEFAULT_TIMEZONE, orgDateString, orgParts, orgTimeString, orgTimeToDate, resolveTimeZone, startOfOrgDay } from './time';

const BA = 'America/Argentina/Buenos_Aires'; // UTC-3 fijo (sin DST)
const TOKYO = 'Asia/Tokyo'; // UTC+9
const NY = 'America/New_York'; // DST

describe('Zona horaria de la organización (issue #24)', () => {
  it('orgParts lee el reloj de pared en la zona, no en la del servidor', () => {
    const parts = orgParts(new Date('2030-01-07T13:00:00Z'), BA);
    expect(parts).toEqual({ year: 2030, month: 1, day: 7, weekday: 1, hour: 10, minute: 0 });
  });

  it('orgTimeToDate convierte un reloj de pared de la zona al instante UTC exacto', () => {
    expect(orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, BA).toISOString()).toBe('2030-01-07T13:00:00.000Z');
    expect(orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 10, minute: 0 }, TOKYO).toISOString()).toBe('2030-01-07T01:00:00.000Z');
  });

  it('startOfOrgDay devuelve la medianoche local de la zona', () => {
    const instant = new Date('2030-01-07T15:30:00Z');
    expect(startOfOrgDay(instant, BA).toISOString()).toBe('2030-01-07T03:00:00.000Z');
    expect(startOfOrgDay(instant, TOKYO).toISOString()).toBe('2030-01-07T15:00:00.000Z');
  });

  it('startOfOrgDay es estable a través de un cambio de horario de verano', () => {
    expect(startOfOrgDay(new Date('2026-03-08T12:00:00Z'), NY).toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(startOfOrgDay(new Date('2026-11-01T12:00:00Z'), NY).toISOString()).toBe('2026-11-01T04:00:00.000Z');
  });

  it('addOrgDays suma días de calendario conservando la hora de pared', () => {
    const monday = startOfOrgDay(new Date('2030-01-07T12:00:00Z'), BA);
    expect(addOrgDays(monday, 7, BA).toISOString()).toBe('2030-01-14T03:00:00.000Z');
  });

  it('addOrgHours maneja el cruce de día en el reloj de la zona', () => {
    const atTenPm = orgTimeToDate({ year: 2030, month: 1, day: 7, hour: 22, minute: 0 }, BA);
    expect(atTenPm.toISOString()).toBe('2030-01-08T01:00:00.000Z');
    expect(addOrgHours(atTenPm, 2, BA).toISOString()).toBe('2030-01-08T03:00:00.000Z');
  });

  it('resolveTimeZone cae a la predeterminada ante un valor inválido', () => {
    expect(resolveTimeZone('America/Argentina/Buenos_Aires')).toBe('America/Argentina/Buenos_Aires');
    expect(resolveTimeZone('No/Existe')).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimeZone(undefined)).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimeZone('')).toBe(DEFAULT_TIMEZONE);
  });

  it('los formateadores de notificación usan la zona de la organización', () => {
    const instant = new Date('2030-01-07T13:00:00Z');
    expect(orgDateString(instant, BA)).toBe('07/01/2030');
    expect(orgTimeString(instant, BA)).toContain('10:00');
  });
});