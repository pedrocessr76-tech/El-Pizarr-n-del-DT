import { WhatsAppMessage, WhatsAppDeliveryResult } from './messaging.types';

/**
 * Contrato de proveedor de WhatsApp: los consumidores solo conocen
 * `MessagingService`, y cada adaptador (log, Cloud API, whatsapp-web.js)
 * implementa esta interfaz sin tocar a quienes envían mensajes.
 */
export interface MessageProvider {
  readonly name: string;
  send(message: WhatsAppMessage): Promise<WhatsAppDeliveryResult>;
}