import { resolveSynchronize } from './synchronize.config';

describe('resolveSynchronize', () => {
  it('nunca habilita synchronize en producción, aunque el entorno lo pida explícitamente', () => {
    expect(resolveSynchronize('true', true)).toBe(false);
    expect(resolveSynchronize(undefined, true)).toBe(false);
  });

  it('permite override explícito en desarrollo', () => {
    expect(resolveSynchronize('true', false)).toBe(true);
    expect(resolveSynchronize('false', false)).toBe(false);
  });

  it('habilita synchronize por defecto solo fuera de producción', () => {
    expect(resolveSynchronize(undefined, false)).toBe(true);
  });
});