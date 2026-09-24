import { Inject, Injectable } from '@nestjs/common';
import { WhatsAppMessageKind } from './messaging.types';
import { MessageProvider } from './messaging.provider';
import { MESSAGE_PROVIDER } from './messaging.module';

/**
 * Punto único de envío de WhatsApp para los consumidores (recordatorios,
 * confirmaciones, resumen diario). Delega en el proveedor activo; la validación
 * de consentimiento vive en el dominio (domain-policy.canSendWhatsApp), que los
 * consumidores deben consultar antes de llamar aquí.
 */
@Injectable()
export class MessagingService {
  constructor(@Inject(MESSAGE_PROVIDER) private readonly provider: MessageProvider) {}

  send(to: string, body: string, kind: WhatsAppMessageKind = 'generic', metadata?: Record<string, unknown>) {
    return this.provider.send({ to, body, kind, metadata });
  }
}