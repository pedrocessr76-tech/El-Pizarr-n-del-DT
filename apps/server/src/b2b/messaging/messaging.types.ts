/** Tipos compartidos del canal de mensajería multicanal (#34/#37). */

/** Canales de salida soportados. Cada uno resuelve su propio proveedor. */
export type MessageChannel = 'email' | 'whatsapp';

export type MessageKind = 'generic' | 'confirmation' | 'reminder' | 'summary' | 'payment' | 'email-verification';

export interface ChannelMessage {
  channel: MessageChannel;
  /** Teléfono en E.164 para `whatsapp`, dirección de email para `email`. */
  to: string;
  body: string;
  kind: MessageKind;
  /** Obligatorio en la práctica para `email`; ignorado en otros canales. */
  subject?: string;
  /**
   * Versión HTML del mismo mensaje, para clientes que la renderizan. Siempre
   * acompaña a `body`: el texto plano es el que se muestra cuando el cliente no
   * soporta HTML o.images bloqueadas, así que nunca se envía uno sin el otro.
   */
  html?: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryResult {
  delivered: boolean;
  provider: string;
  messageId?: string | null;
  error?: string | null;
}
