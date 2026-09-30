import { MessageChannel } from './messaging.types';
import { MessageProvider } from './messaging.provider';
import { MessagingService } from './messaging.service';
import { MESSAGE_PROVIDERS } from './messaging.constants';
import { LogMessageProvider } from './log-message.provider';
import { smtpConfigFromEnv } from './smtp-message.provider';

function registry(entries: Partial<Record<MessageChannel, MessageProvider>>): ReadonlyMap<MessageChannel, MessageProvider> {
  return new Map(Object.entries(entries) as [MessageChannel, MessageProvider][]);
}

function capture(name = 'fake') {
  const captured: { to: string; body: string; kind: string; subject?: string; html?: string; metadata?: unknown }[] = [];
  const provider: MessageProvider = {
    name,
    channel: 'whatsapp',
    send: async (message) => {
      captured.push(message);
      return { delivered: true, provider: name, messageId: 'm1' };
    },
  };
  return { provider, captured };
}

// La fachada MessagingService enruta por canal al proveedor activo (#34/#37).
describe('MessagingService', () => {
  it('reenvía destino, cuerpo, kind y metadata al proveedor de WhatsApp', async () => {
    const { provider, captured } = capture();
    const service = new MessagingService(registry({ whatsapp: provider }));

    const result = await service.sendWhatsApp('+5491155551234', 'Recordatorio', 'reminder', { bookingId: 'b1' });

    expect(result).toEqual({ delivered: true, provider: 'fake', messageId: 'm1' });
    expect(captured).toEqual([
      { channel: 'whatsapp', to: '+5491155551234', body: 'Recordatorio', kind: 'reminder', metadata: { bookingId: 'b1' } },
    ]);
  });

  it('exige asunto en el canal de email y enruta al proveedor de email', async () => {
    const { provider, captured } = capture('smtp');
    const service = new MessagingService(registry({ email: provider }));

    await service.sendEmail('cliente@ejemplo.com', 'Tu turno es mañana', 'Recordatorio de turno', 'reminder');

    expect(captured[0]).toEqual({
      channel: 'email',
      to: 'cliente@ejemplo.com',
      body: 'Tu turno es mañana',
      subject: 'Recordatorio de turno',
      kind: 'reminder',
      metadata: undefined,
    });
  });

  it('desarma el cuerpo con texto y HTML cuando viene la plantilla', async () => {
    const { provider, captured } = capture('smtp');
    const service = new MessagingService(registry({ email: provider }));

    await service.sendEmail(
      'ana@club.com',
      { text: 'Confirmá tu email', html: '<p>Confirmá tu email</p>' },
      'Verificación',
      'email-verification',
    );

    expect(captured[0].body).toBe('Confirmá tu email');
    expect(captured[0].html).toBe('<p>Confirmá tu email</p>');
  });

  it('deja el HTML vacío cuando el cuerpo es un string pelado', async () => {
    const { provider, captured } = capture('smtp');
    const service = new MessagingService(registry({ email: provider }));

    // Los recordatorios (#34) siguen pasando un string: no tienen que saber
    // que existe el HTML.
    await service.sendEmail('cliente@ejemplo.com', 'Tu turno es mañana', 'Turno');

    expect(captured[0].body).toBe('Tu turno es mañana');
    expect(captured[0].html).toBeUndefined();
  });

  it('usa el proveedor del canal, no el del otro', async () => {
    const whatsapp = capture('solo-wa');
    const email = capture('smtp');
    const service = new MessagingService(registry({ whatsapp: whatsapp.provider, email: email.provider }));

    await service.sendWhatsApp('+5491155551234', 'Aviso');
    await service.sendEmail('cliente@ejemplo.com', 'Aviso', 'Asunto');

    expect(whatsapp.captured).toHaveLength(1);
    expect(email.captured).toHaveLength(1);
  });

  it('usa kind genérico por defecto', async () => {
    const { provider, captured } = capture();
    const service = new MessagingService(registry({ whatsapp: provider }));

    await service.sendWhatsApp('+5491155551234', 'Hola');

    expect(captured[0].kind).toBe('generic');
  });

  it('cae al placeholder si el canal no tiene proveedor configurado', async () => {
    const service = new MessagingService(new Map());

    // No debe lanzar ni intentar salir a la red: la entrega simulada es el default.
    await expect(service.sendWhatsApp('+5491155551234', 'Aviso')).resolves.toMatchObject({ delivered: true, provider: 'log' });
  });
});

describe('LogMessageProvider', () => {
  it('declara el canal que atiende y reporta entrega simulada', async () => {
    const provider = new LogMessageProvider('email');
    expect(provider.name).toBe('log');
    expect(provider.channel).toBe('email');
    await expect(provider.send({ channel: 'email', to: 'a@b.com', body: 'x', kind: 'generic' }))
      .resolves.toMatchObject({ delivered: true, provider: 'log' });
  });

  it('el token de registro está definido', () => {
    expect(MESSAGE_PROVIDERS).toBeDefined();
  });
});

describe('smtpConfigFromEnv', () => {
  it('devuelve null sin SMTP_HOST', () => {
    expect(smtpConfigFromEnv({ SMTP_FROM: 'a@b.com' })).toBeNull();
  });

  it('devuelve null sin remitente', () => {
    expect(smtpConfigFromEnv({ SMTP_HOST: 'smtp.ejemplo.com' })).toBeNull();
  });

  it('deriva puerto, seguridad y credenciales', () => {
    const config = smtpConfigFromEnv({
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SMTP_USER: 'cuenta@gmail.com',
      SMTP_PASSWORD: 'clave',
    });
    expect(config).toEqual({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: 'cuenta@gmail.com',
      password: 'clave',
      from: 'cuenta@gmail.com',
      fromName: undefined,
    });
  });

  it('usa 587 sin cifrar cuando el puerto no es 465', () => {
    const config = smtpConfigFromEnv({ SMTP_HOST: 'smtp.ejemplo.com', SMTP_FROM: 'no-reply@ejemplo.com' });
    expect(config).toMatchObject({ port: 587, secure: false, user: undefined, password: undefined });
  });

  it('respeta SMTP_SECURE explícito', () => {
    expect(smtpConfigFromEnv({ SMTP_HOST: 'h', SMTP_FROM: 'a@b.com', SMTP_PORT: '25', SMTP_SECURE: 'true' }))
      .toMatchObject({ port: 25, secure: true });
  });
});
