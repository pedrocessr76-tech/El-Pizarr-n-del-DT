import { escapeHtml, renderVerificationEmail } from './email-verification.template';

describe('Plantilla del email de verificación', () => {
  const base = { link: 'http://localhost:5173/canchas/verificar-email?token=abc123', ttlMinutes: 30 };

  it('el enlace aparece como botón y también en texto plano', () => {
    const mail = renderVerificationEmail({ ...base, fullName: 'Ana' });

    // Sin href el enlace sería inusable: hay que poder copiarlo a mano.
    expect(mail.html).toContain(`href="${base.link}"`);
    expect(mail.text).toContain(base.link);
    expect(mail.subject).toBe('Confirmá tu email para entrar al Sistema Canchas');
  });

  it('el texto plano y el HTML siempre vienen juntos', () => {
    const mail = renderVerificationEmail({ ...base, fullName: 'Ana' });

    // El texto plano es el respaldo para clientes sin HTML: si falta uno de los
    // dos, el mensaje se pierde en un tipo de cliente.
    expect(mail.text.length).toBeGreaterThan(0);
    expect(mail.html).toContain('<!doctype html>');
  });

  it('escapa un nombre con HTML para que no inyecte marcado', () => {
    const mail = renderVerificationEmail({ ...base, fullName: '<script>alert(1)</script>' });

    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });

  it('escapa también comillas, para no romper atributos', () => {
    expect(escapeHtml('a"b\'c')).toBe('a&quot;b&#39;c');
  });

  it('usa el nombre por defecto cuando no viene', () => {
    const mail = renderVerificationEmail({ ...base, fullName: '   ' });

    expect(mail.html).toContain('Hola nosotros,');
  });

  it('promete la ventana de validez que le pasan, no una fija', () => {
    const mail = renderVerificationEmail({ ...base, fullName: 'Ana', ttlMinutes: 45 });

    expect(mail.text).toContain('45 minutos');
    expect(mail.html).toContain('45 minutos');
  });

  it('avisa que el enlace es de un solo uso', () => {
    const mail = renderVerificationEmail({ ...base, fullName: 'Ana' });

    expect(mail.text).toMatch(/una sola vez/);
    expect(mail.html).toMatch(/una sola vez/);
  });
});