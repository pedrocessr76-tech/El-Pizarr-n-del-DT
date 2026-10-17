import { AddB2bUserLastLoginAt1710000000010 } from './1710000000010-AddB2bUserLastLoginAt';

describe('Migración AddB2bUserLastLoginAt (lastLoginAt + updatedAt en b2b_users)', () => {
  let migration: AddB2bUserLastLoginAt1710000000010;
  let queryRunner: { query: jest.Mock; manager: any };

  beforeEach(() => {
    migration = new AddB2bUserLastLoginAt1710000000010();
    queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
      manager: {},
    };
  });

  it('debe agregar lastLoginAt y updatedAt a b2b_users', async () => {
    await migration.up(queryRunner as any);
    const queries = queryRunner.query.mock.calls.map((c) => c[0]);
    expect(queries.some((q) => q.includes('ADD COLUMN IF NOT EXISTS "lastLoginAt"'))).toBe(true);
    expect(queries.some((q) => q.includes('ADD COLUMN IF NOT EXISTS "updatedAt"'))).toBe(true);
  });

  it('debe revertir eliminando ambas columnas', async () => {
    await migration.down(queryRunner as any);
    const queries = queryRunner.query.mock.calls.map((c) => c[0]);
    expect(queries.some((q) => q.includes('DROP COLUMN IF EXISTS "lastLoginAt"'))).toBe(true);
    expect(queries.some((q) => q.includes('DROP COLUMN IF EXISTS "updatedAt"'))).toBe(true);
  });
});