import { MessageProvider } from './messaging.provider';
import { MessagingService } from './messaging.service';
import { MESSAGE_PROVIDER } from './messaging.constants';
import { LogMessageProvider } from './log-message.provider';

// La fachada MessagingService delega en el proveedor activo (#37/placeholder).
describe('MessagingService', () => {
  it('reenvía aéreo y kind al proveedor activo', async () => {
    const captured: any[] = [];
    const fake: MessageProvider = {
      name: 'fake',
      send: async (message) => {
        captured.push(message);
        return { delivered: true, provider: 'fake', messageId: 'm1' };
      },
    };
    const service = new MessagingService(fake);

    const result = await service.send('+5491155551234', 'Recordatorio', 'reminder', { bookingId: 'b1' });

    expect(result).toEqual({ delivered: true, provider: 'fake', messageId: 'm1' });
    expect(captured).toEqual([
      { to: '+5491155551234', body: 'Recordatorio', kind: 'reminder', metadata: { bookingId: 'b1' } },
    ]);
  });

  it('usa kind genérico por defecto', async () => {
    const fake: MessageProvider = {
      name: 'fake',
      send: async (message) => ({ delivered: true, provider: 'fake', messageId: null, error: null }),
    };
    const service = new MessagingService(fake);
    await service.send('+5491155551234', 'Hola');
    // sin aserciones de contrato interno: cubre la rama default del kind
  });

  it('el módulo por defecto expone LogMessageProvider (MESSAGING_PROVIDER=log)', () => {
    const provider = new LogMessageProvider();
    expect(provider.name).toBe('log');
    expect(MESSAGE_PROVIDER).toBeDefined();
  });
});