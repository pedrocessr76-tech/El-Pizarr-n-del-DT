/**
 * Normalización de teléfonos de WhatsApp a E.164 para Sistema Canchas (#37).
 * Entrada vacía → `null` (desactiva el contacto). Formato inválido → `{ valid: false }`.
 */
export const WHATSAPP_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

export type NormalizePhoneResult = { valid: true; value: string | null } | { valid: false };

export function normalizeWhatsAppPhone(input: string | null | undefined): NormalizePhoneResult {
  if (input === null || input === undefined) return { valid: true, value: null };
  const cleaned = input.replace(/[\s\-().]/g, '').trim();
  if (cleaned === '') return { valid: true, value: null };
  if (WHATSAPP_PHONE_PATTERN.test(cleaned)) return { valid: true, value: cleaned };
  return { valid: false };
}