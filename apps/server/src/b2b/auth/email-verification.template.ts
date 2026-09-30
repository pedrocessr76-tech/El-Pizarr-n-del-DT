/**
 * Plantilla del email de verificación (#verificacion-de-email).
 *
 * Vive aparte del `EmailVerificationMailer` a propósito: es contenido, no
 * lógica, y la próxima vez que haya que cambiar un color o una frase no se
 * debería tocar el código que emite el token.
 *
 * Reglas que no hay que romper al editar:
 * 1. Todo dato que venga de la persona (`fullName`) pasa por `escapeHtml`. Un
 *    nombre con `<` inyectaría HTML en el correo.
 * 2. La URL se arma con `href` y con el texto visible del botón. Las plantillas
 *    sin `<a href>` no sirven: el enlace tiene que poder copiarse.
 * 3. `text` y `html` van juntos. El texto plano es lo que ven los clientes sin
 *    HTML y lo que se lee en el modo de sólo texto del correo.
 * 4. Sin imágenes externas ni webfonts: si el cliente las bloquea, el mensaje
 *    tiene que seguir siendo legible y el botón tiene que seguir siendo usable.
 */

import { emailLayout, escapeHtml, fallbackLink, primaryButton } from '../messaging/html';

export interface VerificationEmailContent {
  fullName: string | null | undefined;
  link: string;
  /** Minutos de validez del enlace, para no mentirle a nadie. */
  ttlMinutes: number;
}

/** Reexportado desde el módulo compartido de plantillas. */
export { escapeHtml };

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderVerificationEmail(input: VerificationEmailContent): RenderedEmail {
  const who = escapeHtml(input.fullName?.trim() || 'nosotros');
  // La URL no necesita escape (viene del servidor), pero se pasa igual para que
  // este archivo tenga una sola regla y nadie la saltee por costume.
  const link = escapeHtml(input.link);
  const subject = 'Confirmá tu email para entrar al Sistema Canchas';

  const text = [
    `Hola ${input.fullName?.trim() || ''}`.trimEnd() + ',',
    '',
    'Confirmá tu email para activar tu cuenta en el Sistema Canchas.',
    '',
    input.link,
    '',
    `El enlace vence en ${input.ttlMinutes} minutos y sirve una sola vez.`,
    'Si no lo pediste vos, ignorá este mensaje: nadie puede entrar a tu cuenta',
    'sin verificar el email.',
  ].join('\n');

  const bodyHtml = `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Hola ${who},</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
    Confirm&aacute; tu email para activar tu cuenta en el Sistema Canchas.
    Nos confirma que esta direcci&oacute;n es real, as&iacute; nadie va a reservar a tu nombre.
  </p>
  ${primaryButton(link, 'Confirmar mi email')}
  ${fallbackLink(link)}
  <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
    El enlace vence en ${input.ttlMinutes} minutos y sirve una sola vez.
    <strong style="color:#334155;">Si no lo pediste vos, ignor&aacute; este mensaje:</strong>
    nadie puede entrar a tu cuenta sin verificar el email.
  </p>`;

  const html = emailLayout({
    preheader: `Confirmá tu email para activar tu cuenta. Vence en ${input.ttlMinutes} minutos.`,
    eyebrow: 'Verificación de email',
    bodyHtml,
    footerNote: 'Este mensaje se envió porque creaste una cuenta con esta dirección.',
  });

  return { subject, text, html };
}