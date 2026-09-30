import { ChannelMessage, DeliveryResult, MessageChannel } from './messaging.types';

/**
 * Contrato de proveedor de mensajería: los consumidores solo conocen
 * `MessagingService`, y cada adaptador (log, smtp, Meta Cloud API,
 * whatsapp-web.js) implementa esta interfaz sobre un canal sin tocar a
 * quienes envían mensajes.
 */
export interface MessageProvider {
  readonly name: string;
  /** Canal que el adaptador sabe atender; se usa para validar el registro. */
  readonly channel: MessageChannel;
  send(message: ChannelMessage): Promise<DeliveryResult>;
}
