/**
 * Piezas compartidas por las plantillas HTML de email.
 *
 * El esqueleto vive acá y no en cada plantilla para que cambiar un color o el
 * encabezado sea una edición en un solo lugar. Las plantillas sólo aportan el
 * contenido; si una necesita romper el layout, es porque el layout está mal.
 *
 * Reglas que se respetan en todo el archivo y que hay que mantener:
 * 1. Todo dato que venga de la persona pasa por `escapeHtml` antes de entrar al
 *    HTML. Un nombre con `<` inyectaría marcado en el correo.
 * 2. Sin imágenes externas ni webfonts: con imágenes bloqueadas el mensaje tiene
 *    que seguir siendo legible y la acción principal sigue siendo pulsable.
 * 3. Tablas y estilos inline. Los clientes de correo borran `<style>` y las
 *    clases, así que el HTML tiene que traer el estilo puesto.
 */

/** Escapa los cinco caracteres que pueden romper el HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailLayout {
  /** Texto que se ve en la lista de la bandeja, sin abrir el correo. */
  preheader: string;
  /** Etiqueta chica del header verde. */
  eyebrow?: string;
  /** Contenido ya escapado, listo para insertar. */
  bodyHtml: string;
  /** Origen de la leyenda del pie. */
  footerNote?: string;
}

/** Envuelve el contenido en el esqueleto de marca de Sistema Canchas. */
export function emailLayout(input: EmailLayout): string {
  const footer = escapeHtml(input.footerNote ?? 'Este mensaje se envió porque tenés una reserva registrada en el sistema.');
  return `<!doctype html>
<html lang="es-AR">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:24px 32px;background:#15803d;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:.2px;">Sistema Canchas</td>
                  ${input.eyebrow ? `<td align="right" style="font-size:11px;color:#bbf7d0;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(input.eyebrow)}</td>` : ''}
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:32px;">${input.bodyHtml}</td></tr>
          <tr>
            <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;line-height:1.6;color:#94a3b8;">
              Sistema Canchas &middot; ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Botón principal. El `href` tiene que venir ya escapado por la plantilla. */
export function primaryButton(link: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr><td style="border-radius:10px;background:#15803d;">
    <a href="${link}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}

/** Enlace en crudo, para cuando el botón no se puede usar (mail sin HTML). */
export function fallbackLink(link: string): string {
  return `<p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">Si el bot&oacute;n no funciona, copi&aacute; este enlace:</p>
  <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#15803d;">${link}</p>`;
}