import { Injectable, Logger } from '@nestjs/common';
import { ChannelMessage, DeliveryResult } from './messaging.types';
import { MessageProvider } from './messaging.provider';

/**
 * Adaptador placeholder/logger (por defecto en cualquier canal): registra el
 * envío simulado sin tocar ningún servicio externo. Es la vía gratuita y
 * segura para desarrollar #34/#36 sin depender de un proveedor; los
 * adaptadores reales se enchufan después sobre la misma interfaz.
 */
@Injectable()
export class LogMessageProvider implements MessageProvider {
  readonly name = 'log';
  private readonly logger = new Logger('MessagingSender');

  constructor(readonly channel: ChannelMessage['channel'] = 'whatsapp') {}

  async send(message: ChannelMessage): Promise<DeliveryResult> {
    this.logger.log(
      `[${this.channel}:${this.name}] envío simulado a ${message.to} (${message.kind}): ${message.body}`,
    );
    return { delivered: true, provider: this.name, messageId: null, error: null };
  }
}
