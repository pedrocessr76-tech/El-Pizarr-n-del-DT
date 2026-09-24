/** Tipos compartidos del canal de mensajería de WhatsApp (#37). */

export type WhatsAppMessageKind =
  | 'generic'
  | 'confirmation'
  | 'reminder'
  | 'summary'
  | 'payment';

export interface WhatsAppMessage {
  to: string;
  body: string;
  kind: WhatsAppMessageKind;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppDeliveryResult {
  delivered: boolean;
  provider: string;
  messageId?: string | null;
  error?: string | null;
}