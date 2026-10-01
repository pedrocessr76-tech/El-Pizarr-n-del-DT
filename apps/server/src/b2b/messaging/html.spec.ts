import { emailLayout, escapeHtml, fallbackLink, primaryButton } from './html';

describe('html', () => {
  describe('escapeHtml', () => {
    it('escapa los cinco caracteres que rompen el HTML', () => {
      expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
        '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
      );
    });

    it('escapa ampersand una sola vez, sin dobles escapes', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('a & b')).not.toContain('&amp;amp;');
    });

    it('deja intacto el texto sin caracteres peligrosos', () => {
      expect(escapeHtml('Cancha 1 - 19:00')).toBe('Cancha 1 - 19:00');
    });
  });

  describe('emailLayout', () => {
    const body = '<p style="color:#000;">contenido</p>';

    it('envuelve el contenido con el encabezado de marca', () => {
      const html = emailLayout({ preheader: 'Vista previa', bodyHtml: body });

      expect(html).toContain('<!doctype html>');
      expect(html).toContain('lang="es-AR"');
      expect(html).toContain('Sistema Canchas');
      expect(html).toContain(body);
    });

    it('muestra la etiqueta del encabezado sólo cuando se pide', () => {
      expect(emailLayout({ preheader: 'x', bodyHtml: body })).not.toContain('align="right"');
      expect(emailLayout({ preheader: 'x', eyebrow: 'Aviso', bodyHtml: body })).toContain('Aviso');
    });

    it('escapa el preheader para que no inyecte marcado en la bandeja', () => {
      const html = emailLayout({ preheader: '<b>urgente</b>', bodyHtml: body });

      expect(html).toContain('&lt;b&gt;urgente&lt;/b&gt;');
      expect(html).not.toContain('<b>urgente</b>');
    });

    it('usa la nota de pie que le pasan', () => {
      const html = emailLayout({ preheader: 'x', bodyHtml: body, footerNote: 'Por la reserva en La Cancha.' });

      expect(html).toContain('Por la reserva en La Cancha.');
    });

    it('no depende de estilos externos ni de imágenes remotas', () => {
      const html = emailLayout({ preheader: 'x', bodyHtml: body });

      // Con <style> bloqueado o imágenes apagadas el correo tiene que seguir funcionando.
      expect(html).not.toContain('<style');
      expect(html).not.toContain('<img');
      expect(html).not.toContain('http://');
    });
  });

  describe('primaryButton', () => {
    it('arma un enlace pulsable con estilos inline', () => {
      const html = primaryButton('https://app.test/verificar?token=abc', 'Confirmar');

      expect(html).toContain('href="https://app.test/verificar?token=abc"');
      expect(html).toContain('Confirmar');
      expect(html).not.toContain('<style');
    });

    it('escapa la etiqueta pero deja el href que ya viene escapado de la plantilla', () => {
      expect(primaryButton('https://app.test/x', '<Confirmar>')).toContain('&lt;Confirmar&gt;');
    });
  });

  describe('fallbackLink', () => {
    it('muestra el enlace en crudo para cuando el botón no se puede usar', () => {
      const html = fallbackLink('https://app.test/verificar?token=abc');

      expect(html).toContain('https://app.test/verificar?token=abc');
      expect(html).toContain('word-break:break-all');
    });
  });
});