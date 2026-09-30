import { Module } from '@nestjs/common';
import { MessageProvider } from './messaging.provider';
import { MessageChannel } from './messaging.types';
import { LogMessageProvider } from './log-message.provider';
import { SmtpMessageProvider, smtpConfigFromEnv } from './smtp-message.provider';
import { MessagingService } from './messaging.service';
import { MESSAGE_PROVIDERS } from './messaging.constants';

const CHANNELS: MessageChannel[] = ['email', 'whatsapp'];

function buildProvider(channel: MessageChannel, env: NodeJS.ProcessEnv): MessageProvider {
  const selected = (env[`MESSAGING_PROVIDER_${channel.toUpperCase()}`] ?? '').trim().toLowerCase();
  if (channel === 'email' && selected === 'smtp') {
    const config = smtpConfigFromEnv(env);
    if (config) return new SmtpMessageProvider(config);
  }
  // Proveedor desconocido o sin configuración completa: cae al placeholder
  // para no romper el boot ni mandar half-configurado.
  return new LogMessageProvider(channel);
}

/**
 * Resuelve un proveedor por canal desde el entorno. El canal de email usa
 * `MESSAGING_PROVIDER_EMAIL` (`log` | `smtp`) y el de WhatsApp
 * `MESSAGING_PROVIDER_WHATSAPP`. Cada canal cae a `log` si no está declarado o
 * si le falta configuración, de modo que un despliegue sin SMTP arranca igual
 * y deja los envíos marcados como simulados.
 */
@Module({
  providers: [
    {
      provide: MESSAGE_PROVIDERS,
      useFactory: (): ReadonlyMap<MessageChannel, MessageProvider> =>
        new Map(CHANNELS.map((channel) => [channel, buildProvider(channel, process.env)])),
    },
    MessagingService,
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
