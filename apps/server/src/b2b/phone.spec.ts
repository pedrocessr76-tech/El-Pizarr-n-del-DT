import { normalizeWhatsAppPhone, WHATSAPP_PHONE_PATTERN } from './phone';

describe('normalizeWhatsAppPhone (#37)', () => {
  it('normaliza un número con código de país y separadores', () => {
    expect(normalizeWhatsAppPhone('+54 9 11 5555-1234')).toEqual({ valid: true, value: '+5491155551234' });
    expect(normalizeWhatsAppPhone('+54(11)5555-1234')).toEqual({ valid: true, value: '+541155551234' });
  });

  it('acepta números sin separadores', () => {
    expect(normalizeWhatsAppPhone('+5491155551234')).toEqual({ valid: true, value: '+5491155551234' });
  });

  it('devuelve null para entrada vacía o ausente (desactiva el contacto)', () => {
    expect(normalizeWhatsAppPhone('')).toEqual({ valid: true, value: null });
    expect(normalizeWhatsAppPhone('   ')).toEqual({ valid: true, value: null });
    expect(normalizeWhatsAppPhone(undefined)).toEqual({ valid: true, value: null });
    expect(normalizeWhatsAppPhone(null)).toEqual({ valid: true, value: null });
  });

  it('rechaza formatos inválidos', () => {
    expect(normalizeWhatsAppPhone('5491155551234')).toEqual({ valid: false }); // sin +
    expect(normalizeWhatsAppPhone('+54 911 5555-12AB')).toEqual({ valid: false }); // letras
    expect(normalizeWhatsAppPhone('+')).toEqual({ valid: false }); // sin dígitos
    expect(normalizeWhatsAppPhone('+12345678901234567')).toEqual({ valid: false }); // > 15 dígitos
  });

  it('el patrón solo admite E.164 de hasta 15 dígitos', () => {
    expect(WHATSAPP_PHONE_PATTERN.test('+5491155551234')).toBe(true);
    expect(WHATSAPP_PHONE_PATTERN.test('+12345678901234567')).toBe(false);
    expect(WHATSAPP_PHONE_PATTERN.test('01155551234')).toBe(false);
  });
});