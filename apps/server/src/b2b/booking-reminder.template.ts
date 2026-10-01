import { emailLayout, escapeHtml } from './messaging/html';

/**
 * Plantilla del recordatorio de reserva por email (#34).
 *
 * Es el mismo camino que la verificación de email: `text` + `html` por el canal
 * de email, con el texto plano como respaldo para clientes que no renderizan
 * HTML. Igual que en la otra plantilla, el contenido está separado de la lógica
 * que decide a quién y cuándo avisar.
 */

export interface BookingReminderContent {
  clientName: string | null | undefined;
  courtName: string;
  /** Fecha y hora ya formateadas en la zona horaria del complejo. */
  when: string;
  /** Minutos de anticipación del aviso, para redactar "mañana" con sentido. */
  minutesBefore: number;
  organizationName?: string | null;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** "en 24 horas" / "en 30 minutos": el aviso tiene que decir cuánto falta. */
function humanLead(minutesBefore: number): string {
  if (minutesBefore % 60 === 0 && minutesBefore >= 60) {
    const hours = minutesBefore / 60;
    return hours === 1 ? 'en 1 hora' : `en ${hours} horas`;
  }
  if (minutesBefore === 0) return 'ahora mismo';
  return `en ${minutesBefore} minutos`;
}

export function renderBookingReminderEmail(input: BookingReminderContent): RenderedEmail {
  const rawName = input.clientName?.trim();
  const who = escapeHtml(rawName || '');
  const court = escapeHtml(input.courtName);
  const when = escapeHtml(input.when);
  const lead = humanLead(input.minutesBefore);
  const greeting = rawName ? `Hola ${who},` : 'Hola,';
  const subject = `Turno en ${input.courtName} ${lead}`;

  const text = [
    greeting,
    '',
    `Te recordamos tu turno en ${input.courtName} el ${input.when}.`,
    `Faltan ${lead}.`,
    '',
    'Si no vas a venir, avisanos con tiempo para liberar el turno.',
  ].join('\n');

  const bodyHtml = `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${greeting}</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
    Este es tu recordatorio: tu turno en <strong style="color:#0f172a;">${court}</strong> es
    <strong style="color:#0f172a;">${when}</strong>.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e2e8f0;border-radius:12px;">
    <tr>
      <td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Complejo</td>
            <td align="right" style="font-size:14px;font-weight:600;color:#0f172a;">${court}</td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Cuándo</td>
            <td align="right" style="padding-top:10px;font-size:14px;font-weight:600;color:#0f172a;">${when}</td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Falta</td>
            <td align="right" style="padding-top:10px;font-size:14px;font-weight:600;color:#15803d;">${escapeHtml(lead)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
    &iquest;No vas a venir? Avisanos con tiempo para liberar el turno y que otro jugador pueda reservarlo.
  </p>`;

  return {
    subject,
    text,
    html: emailLayout({
      preheader: `Tu turno en ${input.courtName} es ${input.when}. Faltan ${lead}.`,
      eyebrow: 'Recordatorio de turno',
      bodyHtml,
      footerNote: 'Este mensaje se envió porque tenés una reserva registrada en el sistema.',
    }),
  };
}