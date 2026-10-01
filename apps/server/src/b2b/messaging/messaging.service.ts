import { Inject, Injectable } from '@nestjs/common';
import { DeliveryResult, MessageChannel, MessageKind } from './messaging.types';
import { MessageProvider } from './messaging.provider';
import { MESSAGE_PROVIDERS } from './messaging.constants';
import { LogMessageProvider } from './log-message.provider';

/**
 * Cuerpo de un email: texto plano, o texto plano más su versión HTML.
 *
 * Aceptar las dos formas deja que los mensajes que no necesitan plantilla (los
 * recordatorios) sigan pasando un string, sin que ese camino tenga que saber
 * que existe el HTML. El texto plano nunca es opcional: es el respaldo para
 * clientes que no renderizan HTML o bloquean las imágenes.
 */
export type EmailBody = string | { text: string; html: string };

/**
 * Punto único de envío multicanal para los consumidores (recordatorios,
 * confirmaciones, resumen diario). Delega en el proveedor del canal; la
 * validación de consentimiento vive en el dominio (domain-policy), que los
 * consumidores deben consultar antes de llamar aquí.
 *
 * WhatsApp sigue sin proveedor automático a propósito (#34): el aviso corto lo
 * despacha el staff desde el dashboard con un deep link, no el servidor.
 */
@Injectable()
export class MessagingService {
  constructor(@Inject(MESSAGE_PROVIDERS) private readonly providers: ReadonlyMap<MessageChannel, MessageProvider>) {}

  /** Canal sin proveedor configurado: registra y no contacta nada externo. */
  private providerFor(channel: MessageChannel): MessageProvider {
    return this.providers.get(channel) ?? new LogMessageProvider(channel);
  }

  sendWhatsApp(to: string, body: string, kind: MessageKind = 'generic', metadata?: Record<string, unknown>): Promise<DeliveryResult> {
    return this.providerFor('whatsapp').send({ channel: 'whatsapp', to, body, kind, metadata });
  }

  sendEmail(to: string, body: EmailBody, subject: string, kind: MessageKind = 'generic', metadata?: Record<string, unknown>): Promise<DeliveryResult> {
    const text = typeof body === 'string' ? body : body.text;
    const html = typeof body === 'string' ? undefined : body.html;
    return this.providerFor('email').send({ channel: 'email', to, body: text, html, subject, kind, metadata });
  }
}
