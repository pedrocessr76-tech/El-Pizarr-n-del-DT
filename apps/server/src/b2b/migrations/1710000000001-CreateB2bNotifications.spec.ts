// reflect-metadata debe cargarse antes que cualquier entidad con decoradores de TypeORM.
import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { B2B_ENTITIES } from '../b2b.module';
import { CreateB2bNotifications1710000000001 } from './1710000000001-CreateB2bNotifications';

/** QueryRunner falso: registra el SQL en vez de ejecutarlo. */
function recordingQueryRunner(sink: string[]): QueryRunner {
  return {
    query: async (sql: string) => {
      sink.push(String(sql));
      return undefined;
    },
  } as unknown as QueryRunner;
}

/**
 * `buildMetadatas()` es protected en TypeORM; esta subclase lo expone para poder
 * validar la migración contra la metadata sin abrir conexión a PostgreSQL.
 */
class MetadataOnlyDataSource extends DataSource {
  buildMetadata(): Promise<void> {
    return this.buildMetadatas();
  }
}

describe('Migración CreateB2bNotifications (tabla b2b_notifications en bases ya migradas)', () => {
  let dataSource: DataSource;
  let queries: string[] = [];
  let createSql: string;

  beforeAll(async () => {
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: B2B_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;

    queries = [];
    await new CreateB2bNotifications1710000000001().up(recordingQueryRunner(queries));
    const create = queries.find((sql) => sql.includes('CREATE TABLE IF NOT EXISTS b2b_notifications ('));
    expect(create).toBeDefined();
    createSql = create!;
  });

  it('crea la tabla de forma idempotente (IF NOT EXISTS)', () => {
    expect(createSql).toMatch(/CREATE TABLE IF NOT EXISTS b2b_notifications/);
  });

  it('declara todas las columnas de la entidad B2bNotificationEntity', () => {
    const meta = dataSource.entityMetadatas.find((m) => m.tableName === 'b2b_notifications');
    expect(meta).toBeDefined();
    for (const column of meta!.columns) {
      const name = column.databaseName;
      const present = createSql.includes('"' + name + '"') || new RegExp('\\b' + name + '\\b').test(createSql);
      expect(present).toBe(true);
    }
  });

  it('respeta el tenant: organizationId referencia a b2b_organizations', () => {
    expect(createSql).toContain('"organizationId"');
    expect(createSql).toContain('REFERENCES b2b_organizations(id)');
  });

  it('crea los dos índices de consulta con IF NOT EXISTS', () => {
    const created = queries.find((sql) => sql.includes('idx_b2b_notifications_recipient_created'));
    const read = queries.find((sql) => sql.includes('idx_b2b_notifications_recipient_read'));
    expect(created).toBeDefined();
    expect(created).toContain('IF NOT EXISTS');
    expect(read).toBeDefined();
    expect(read).toContain('IF NOT EXISTS');
  });

  it('down elimina la tabla', async () => {
    const drops: string[] = [];
    await new CreateB2bNotifications1710000000001().down(recordingQueryRunner(drops));
    expect(drops).toHaveLength(1);
    expect(drops[0]).toContain('DROP TABLE IF EXISTS b2b_notifications');
  });
});