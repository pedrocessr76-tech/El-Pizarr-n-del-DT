import { DisposableEmailService } from './disposable-email.service';

describe('DisposableEmailService', () => {
  const service = new DisposableEmailService();

  it('bloquea los dominios desechables más comunes', () => {
    expect(service.isDisposable('alguien@mailinator.com')).toBe(true);
    expect(service.isDisposable('alguien@yopmail.com')).toBe(true);
    expect(service.isDisposable('alguien@guerrillamail.com')).toBe(true);
  });

  it('deja pasar los correos normales', () => {
    expect(service.isDisposable('pedrocessr76@gmail.com')).toBe(false);
    expect(service.isDisposable('dueno@complejo.com.ar')).toBe(false);
  });

  it('no le da una segunda oportunidad al caso ni a los espacios', () => {
    expect(service.isDisposable('alguien@MAILINATOR.COM')).toBe(true);
    expect(service.isDisposable('  alguien@mailinator.com  ')).toBe(true);
  });

  it('usa la lista del entorno cuando viene una', () => {
    const custom = new DisposableEmailService('bloqueado.com, otro.com');

    expect(custom.isDisposable('x@bloqueado.com')).toBe(true);
    expect(custom.isDisposable('x@otro.com')).toBe(true);
    expect(custom.isDisposable('x@mailinator.com')).toBe(false);
  });

  it('tolera que la lista del entorno venga con comas y espacios sucios', () => {
    const custom = new DisposableEmailService(' a.com , , b.com ');

    expect(custom.isDisposable('x@a.com')).toBe(true);
    expect(custom.isDisposable('x@b.com')).toBe(true);
    expect(custom.size).toBe(2);
  });

  it('cae a la lista por defecto si la del entorno queda vacía', () => {
    const custom = new DisposableEmailService('');

    expect(custom.isDisposable('x@mailinator.com')).toBe(true);
  });

  it('no rompe con una dirección sin arroba', () => {
    expect(() => service.isDisposable('no-es-un-email')).not.toThrow();
    expect(service.isDisposable('no-es-un-email')).toBe(false);
  });

  it('no expone la lista de dominios para no regalar el mapa', () => {
    const exposed = Object.keys(service as unknown as Record<string, unknown>);
    expect(exposed).toEqual(['blocked']);
  });
});