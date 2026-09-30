import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { B2B_ENTITIES } from '../b2b.module';
import { CreateB2bPivotProfiles1710000000004 } from './1710000000004-CreateB2bPivotProfiles';

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

describe('Migración CreateB2bPivotProfiles (jugador pivote en Sistema Canchas)', () => {
  let dataSource: DataSource;
  let queries: string[];

  beforeAll(async () => {
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: B2B_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;

    queries = [];
    await new CreateB2bPivotProfiles1710000000004().up(recordingQueryRunner(queries));
  });

  it('agrega las tres columnas con ADD COLUMN IF NOT EXISTS y crea índice', () => {
    expect(queries).toHaveLength(4);
    expect(queries[0]).toContain('ADD COLUMN IF NOT EXISTS "pivotAvailable"');
    expect(queries[1]).toContain('ADD COLUMN IF NOT EXISTS "pivotRole"');
    expect(queries[2]).toContain('ADD COLUMN IF NOT EXISTS "pivotPositions"');
    expect(queries[3]).toContain('CREATE INDEX IF NOT EXISTS idx_b2b_users_pivot_available');
  });

  it('declara pivotAvailable, pivotRole y pivotPositions en b2b_users', () => {
    const userStats = dataSource.entityMetadatas.find((m) => m.tableName === 'b2b_users');
    expect(userStats).toBeDefined();
    const available = userStats!.columns.find((column) => column.databaseName === 'pivotAvailable');
    const role = userStats!.columns.find((column) => column.databaseName === 'pivotRole');
    const positions = userStats!.columns.find((column) => column.databaseName === 'pivotPositions');
    expect(available).toBeDefined();
    expect(available!.default).toBe(false);
    expect(role).toBeDefined();
    expect(positions).toBeDefined();
  });

  it('down dropea índice y columnas', async () => {
    const drops: string[] = [];
    await new CreateB2bPivotProfiles1710000000004().down(recordingQueryRunner(drops));
    expect(drops).toHaveLength(2);
    expect(drops[0]).toContain('DROP INDEX IF EXISTS idx_b2b_users_pivot_available');
    expect(drops[1]).toContain('DROP COLUMN IF EXISTS "pivotPositions"');
  });
});
