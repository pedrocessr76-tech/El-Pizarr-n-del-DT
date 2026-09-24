import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppMessage, WhatsAppDeliveryResult } from './messaging.types';
import { MessageProvider } from './messaging.provider';

/**
 * Adaptador placeholder/logger (por defecto): registra el envío simulado sin
 * tocar ningún servicio externo. Es la vía gratuita y segura para desarrollar
 * #34/#36 sin depender de un proveedor; el adaptador real se enchufa después
 * sobre la misma interfaz.
 */
@Injectable()
export class LogMessageProvider implements MessageProvider {
  readonly name = 'log';
  private readonly logger = new Logger('WhatsAppSender');

  async send(message: WhatsAppMessage): Promise<WhatsAppDeliveryResult> {
    this.logger.log(
      `[whatsapp:${this.name}] envío simulado a ${message.to} (${message.kind}): ${message.body}`,
    );
    return { delivered: true, provider: this.name };
  }
}