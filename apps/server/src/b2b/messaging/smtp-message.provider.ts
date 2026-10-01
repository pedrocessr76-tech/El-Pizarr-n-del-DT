import { createTransport, Transporter } from 'nodemailer';
import { ChannelMessage, DeliveryResult } from './messaging.types';
import { MessageProvider } from './messaging.provider';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  /** Dirección remitente; con un mailbox propio no hace falta dominio propio. */
  from: string;
  fromName?: string;
}

/**
 * Traduce el entorno a una configuración SMTP, o `null` si falta lo
 * indispensable. Sin `SMTP_HOST` el canal de email queda en modo simulado.
 */
export function smtpConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const host = (env.SMTP_HOST ?? '').trim();
  const from = (env.SMTP_FROM ?? env.SMTP_USER ?? '').trim();
  if (!host || !from) return null;
  const port = Number(env.SMTP_PORT ?? 587);
  return {
    host,
    port: Number.isInteger(port) && port > 0 ? port : 587,
    secure: (env.SMTP_SECURE ?? '').trim().toLowerCase() === 'true' || Number(env.SMTP_PORT) === 465,
    user: (env.SMTP_USER ?? '').trim() || undefined,
    password: env.SMTP_PASSWORD || undefined,
    from,
    fromName: (env.SMTP_FROM_NAME ?? '').trim() || undefined,
  };
}

/**
 * Adaptador de email por SMTP (#34). Envía texto plano contra un mailbox
 * propio, que es la vía gratuita y operativa sin comprar nada. El transporte se
 * crea en el primer envío para no abrir conexiones al importar el módulo.
 *
 * Migrar a un proveedor transaccional con mejor entregabilidad (Resend, Brevo)
 * es agregar otro `MessageProvider` sobre el canal `email`; este archivo no
 * tiene que cambiar.
 */
export class SmtpMessageProvider implements MessageProvider {
  readonly name = 'smtp';
  readonly channel = 'email' as const;
  private transporter?: Transporter;

  constructor(private readonly config: SmtpConfig) {}

  private transport(): Transporter {
    if (!this.transporter) {
      this.transporter = createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        ...(this.config.user && this.config.password
          ? { auth: { user: this.config.user, pass: this.config.password } }
          : {}),
      });
    }
    return this.transporter;
  }

  async send(message: ChannelMessage): Promise<DeliveryResult> {
    if (!message.subject) throw new Error('El canal de email exige un asunto.');
    const info = await this.transport().sendMail({
      from: this.config.fromName
        ? { name: this.config.fromName, address: this.config.from }
        : this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.body,
      // Con ambos campos, nodemailer arma solo el multipart/alternative: el
      // cliente elige el HTML y el texto plano queda como respaldo.
      ...(message.html ? { html: message.html } : {}),
    });
    return { delivered: true, provider: this.name, messageId: info.messageId ?? null, error: null };
  }
}
