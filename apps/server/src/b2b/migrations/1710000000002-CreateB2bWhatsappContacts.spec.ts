import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { B2B_ENTITIES } from '../b2b.module';
import { CreateB2bWhatsappContacts1710000000002 } from './1710000000002-CreateB2bWhatsappContacts';

/** QueryRunner falso: registra el SQL en vez de ejecutarlo. */
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

describe('Migración CreateB2bWhatsappContacts (contacto WhatsApp en usuarios y organizaciones)', () => {
  let dataSource: DataSource;
  let queries: string[];

  beforeAll(async () => {
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: B2B_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;

    queries = [];
    await new CreateB2bWhatsappContacts1710000000002().up(recordingQueryRunner(queries));
  });

  it('agrega las cuatro columnas con ADD COLUMN IF NOT EXISTS', () => {
    expect(queries).toHaveLength(4);
    for (const sql of queries) {
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
    }
  });

  it('declara whatsappPhone nullable y whatsappOptIn con default false en b2b_users', () => {
    const userStats = dataSource.entityMetadatas.find((m) => m.tableName === 'b2b_users');
    expect(userStats).toBeDefined();
    const phone = userStats!.columns.find((column) => column.databaseName === 'whatsappPhone');
    const optIn = userStats!.columns.find((column) => column.databaseName === 'whatsappOptIn');
    expect(phone).toBeDefined();
    expect(phone!.isNullable).toBe(true);
    expect(optIn).toBeDefined();
    expect(optIn!.default).toBe(false);
  });

  it('declara whatsappPhone nullable y whatsappOptIn con default false en b2b_organizations', () => {
    const orgStats = dataSource.entityMetadatas.find((m) => m.tableName === 'b2b_organizations');
    expect(orgStats).toBeDefined();
    const phone = orgStats!.columns.find((column) => column.databaseName === 'whatsappPhone');
    const optIn = orgStats!.columns.find((column) => column.databaseName === 'whatsappOptIn');
    expect(phone).toBeDefined();
    expect(phone!.isNullable).toBe(true);
    expect(optIn).toBeDefined();
    expect(optIn!.default).toBe(false);
  });

  it('down dropea las cuatro columnas', async () => {
    const drops: string[] = [];
    await new CreateB2bWhatsappContacts1710000000002().down(recordingQueryRunner(drops));
    expect(drops).toHaveLength(4);
    for (const sql of drops) {
      expect(sql).toContain('DROP COLUMN IF EXISTS');
    }
  });
});