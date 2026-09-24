import { Module } from '@nestjs/common';
import { MessageProvider } from './messaging.provider';
import { LogMessageProvider } from './log-message.provider';
import { MessagingService } from './messaging.service';
import { MESSAGE_PROVIDER } from './messaging.constants';

/**
 * Selecciona el adaptador de WhatsApp activo por entorno (`MESSAGING_PROVIDER`).
 * En esta etapa solo existe `log` (placeholder); los proveedores reales se
 * enganchan acá manteniendo la interfaz MessageProvider.
 */
@Module({
  providers: [
    {
      provide: MESSAGE_PROVIDER,
      useFactory: (): MessageProvider => {
        const selected = (process.env.MESSAGING_PROVIDER || 'log').trim().toLowerCase();
        if (selected === 'log') return new LogMessageProvider();
        // Proveedor desconocido: cae al placeholder para no romper el boot.
        return new LogMessageProvider();
      },
    },
    MessagingService,
  ],
  exports: [MessagingService],
})
export class MessagingModule {}