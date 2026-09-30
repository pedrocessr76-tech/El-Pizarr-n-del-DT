import { renderBookingReminderEmail } from './booking-reminder.template';

const BASE = {
  clientName: 'Ana Perez',
  courtName: 'Cancha 1',
  when: '2026-03-11 a las 19:00',
  minutesBefore: 1440,
};

describe('renderBookingReminderEmail (#34)', () => {
  it('arm Subject, texto y HTML con la hora de la reserva', () => {
    const mail = renderBookingReminderEmail(BASE);

    expect(mail.subject).toBe('Turno en Cancha 1 en 24 horas');
    expect(mail.text).toContain('Ana Perez');
    expect(mail.text).toContain('Cancha 1');
    expect(mail.text).toContain('2026-03-11 a las 19:00');
    expect(mail.html).toContain('Cancha 1');
    expect(mail.html).toContain('2026-03-11 a las 19:00');
  });

  it('usa el layout de marca y conserva el texto plano como respaldo', () => {
    const mail = renderBookingReminderEmail(BASE);

    // El mismo esqueleto que la verificación de email, para que no haya dos marcas.
    expect(mail.html).toContain('Sistema Canchas');
    expect(mail.html).toContain('Recordatorio de turno');
    // Con imágenes y estilos bloqueados el mensaje tiene que seguir siendo legible.
    expect(mail.html).not.toContain('<img');
    expect(mail.text.length).toBeGreaterThan(0);
  });

  it('traduce la anticipación a lenguaje natural', () => {
    expect(renderBookingReminderEmail({ ...BASE, minutesBefore: 1440 }).subject).toContain('24 horas');
    expect(renderBookingReminderEmail({ ...BASE, minutesBefore: 60 }).subject).toContain('1 hora');
    expect(renderBookingReminderEmail({ ...BASE, minutesBefore: 30 }).subject).toContain('30 minutos');
    expect(renderBookingReminderEmail({ ...BASE, minutesBefore: 0 }).subject).toContain('ahora mismo');
  });

  it('saluda sin nombre cuando el cliente no tiene nombre cargado', () => {
    const mail = renderBookingReminderEmail({ ...BASE, clientName: null });

    expect(mail.text).toContain('Hola,');
    expect(mail.text).not.toContain('undefined');
    expect(mail.html).not.toContain('undefined');
    expect(mail.html).not.toContain('Hola ,');
  });

  it('escapa los datos que vienen de la persona y del complejo', () => {
    const mail = renderBookingReminderEmail({
      ...BASE,
      clientName: '<script>alert(1)</script>',
      courtName: 'Cancha "Norte" & Sur',
      when: '<b>19:00</b>',
    });

    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>19:00</b>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('&amp;');
    // El texto plano lleva los valores crudos: el escape es sólo para el HTML.
    expect(mail.text).toContain('<b>19:00</b>');
  });

  it('ignora un nombre que sólo tiene espacios', () => {
    const mail = renderBookingReminderEmail({ ...BASE, clientName: '   ' });

    expect(mail.text).toContain('Hola,');
    expect(mail.html).toContain('Hola,');
  });
});