import { B2bSeedService } from './b2b-seed.service';

// El seed B2B debe quedar restringido a desarrollo (issue #16): en producción se
// desactiva aunque B2B_SEED=true, y las altas de propietario pasan por el onboarding.
describe('B2bSeedService - guard de entorno', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.B2B_SEED;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  function setup() {
    const roles = { upsert: jest.fn().mockResolvedValue(undefined) };
    const empty = {};
    const service = new B2bSeedService(
      empty as never,
      roles as never,
      empty as never,
      empty as never,
      empty as never,
      empty as never,
      empty as never,
      empty as never,
    );
    const warn = jest.spyOn(service['logger'] as any, 'warn').mockImplementation(() => undefined);
    return { service, roles, warn };
  }

  it('no ejecuta nada si B2B_SEED no es true', async () => {
    const { service, roles, warn } = setup();
    process.env.B2B_SEED = 'false';
    process.env.NODE_ENV = 'development';

    await service.onModuleInit();

    expect(warn).not.toHaveBeenCalled();
    expect(roles.upsert).not.toHaveBeenCalled();
  });

  it('no ejecuta nada en producción aunque B2B_SEED=true y avisa por log', async () => {
    const { service, roles, warn } = setup();
    process.env.B2B_SEED = 'true';
    process.env.NODE_ENV = 'production';

    await service.onModuleInit();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('desactivado en producción'));
    expect(roles.upsert).not.toHaveBeenCalled();
  });
});