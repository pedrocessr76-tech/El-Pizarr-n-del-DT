import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { DropUserPivotColumns1790800000000 } from './1790800000000-DropUserPivotColumns';

function recordingQueryRunner(sink: string[]): QueryRunner {
  return {
    query: async (sql: string) => {
      sink.push(String(sql));
      return undefined;
    },
  } as unknown as QueryRunner;
}

class MetadataOnlyDataSource extends DataSource {
  buildMetadata(): Promise<void> {
    return this.buildMetadatas();
  }
}

/**
 * El perfil pivote es del Sistema Canchas: esta migración saca de `users` las
 * columnas y el índice que había dejado la migración ya ejecutada
 * 1790700000000-PivotProfiles.
 */
describe('Migración DropUserPivotColumns (el pivote pasa a b2b_users)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: [UserEntity] });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;
  });

  it('up dropea el índice y las tres columnas de users', async () => {
    const queries: string[] = [];
    await new DropUserPivotColumns1790800000000().up(recordingQueryRunner(queries));

    expect(queries).toHaveLength(2);
    expect(queries[0]).toContain('DROP INDEX IF EXISTS idx_users_pivot_available');
    expect(queries[1]).toContain('DROP COLUMN IF EXISTS "pivotAvailable"');
    expect(queries[1]).toContain('DROP COLUMN IF EXISTS "pivotRole"');
    expect(queries[1]).toContain('DROP COLUMN IF EXISTS "pivotPositions"');
  });

  it('es idempotente: usa IF EXISTS en el DROP', async () => {
    const queries: string[] = [];
    await new DropUserPivotColumns1790800000000().up(recordingQueryRunner(queries));

    for (const sql of queries) {
      expect(sql).toMatch(/IF EXISTS/);
    }
  });

  it('la entidad users ya no declara las columnas del pivote', () => {
    const userMetadata = dataSource.entityMetadatas.find((meta) => meta.tableName === 'users');
    expect(userMetadata).toBeDefined();

    const columns = userMetadata!.columns.map((column) => column.databaseName);
    expect(columns).not.toContain('pivotAvailable');
    expect(columns).not.toContain('pivotRole');
    expect(columns).not.toContain('pivotPositions');
  });

  it('down restituye las columnas y el índice', async () => {
    const queries: string[] = [];
    await new DropUserPivotColumns1790800000000().down(recordingQueryRunner(queries));

    expect(queries).toHaveLength(4);
    expect(queries[0]).toContain('ADD COLUMN IF NOT EXISTS "pivotAvailable"');
    expect(queries[1]).toContain('ADD COLUMN IF NOT EXISTS "pivotRole"');
    expect(queries[2]).toContain('ADD COLUMN IF NOT EXISTS "pivotPositions"');
    expect(queries[3]).toContain('CREATE INDEX IF NOT EXISTS idx_users_pivot_available');
  });
});
