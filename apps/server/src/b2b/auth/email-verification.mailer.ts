import { Injectable, Logger } from '@nestjs/common';
import { MessagingService } from '../messaging/messaging.service';
import { renderVerificationEmail } from './email-verification.template';
import { EMAIL_VERIFICATION_TTL_MS } from './email-verification.service';

/**
 * Arma el email de verificación (#verificacion-de-email) y lo entrega por el
 * canal de email de #34.
 *
 * Sin SMTP configurado el `MessagingService` cae al proveedor `log`: el token
 * queda escrito en los logs del servidor en vez de desaparecer. Es lo que
 * permite desarrollar el flujo completo sin depender de una casilla real, y
 * es también el aviso de que el despliegue no está enviando nada.
 */

/** Route del cliente que consume el token de la query. */
const VERIFY_PATH = '/canchas/verificar-email';

@Injectable()
export class EmailVerificationMailer {
  private readonly logger = new Logger(EmailVerificationMailer.name);

  constructor(private readonly messaging: MessagingService) {}

  /** Base pública del cliente. Sin `B2B_PUBLIC_URL` se asume el dev local. */
  private baseUrl(): string {
    return (process.env.B2B_PUBLIC_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
  }

  verifyUrl(token: string): string {
    return `${this.baseUrl()}${VERIFY_PATH}?token=${encodeURIComponent(token)}`;
  }

  async send(to: string, fullName: string, token: string): Promise<void> {
    const link = this.verifyUrl(token);
    const mail = renderVerificationEmail({
      fullName,
      link,
      // El TTL sale de la constante del servicio: si cambia la expiración, el
      // mail no puede seguir prometiendo la ventana vieja.
      ttlMinutes: Math.round(EMAIL_VERIFICATION_TTL_MS / 60_000),
    });
    const result = await this.messaging.sendEmail(to, { text: mail.text, html: mail.html }, mail.subject, 'email-verification', {
      organizationName: 'Sistema Canchas',
      link,
    });

    if (result.delivered) {
      this.logger.log(`Email de verificación enviado a ${to} vía ${result.provider}.`);
    } else {
      // Sin SMTP esto es `log`/`SIMULATED`: el flujo sigue, pero nadie recibe
      // el enlace. Hay que decirlo, no dejarlo pasar como un envío correcto.
      this.logger.warn(
        `Email de verificación NO entregado a ${to} (proveedor ${result.provider}, modo simulado). ` +
        `Enlace para completar el flujo: ${link}`,
      );
    }
  }
}