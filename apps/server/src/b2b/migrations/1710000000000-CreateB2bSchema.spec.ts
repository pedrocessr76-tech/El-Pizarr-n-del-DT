// reflect-metadata debe cargarse antes que cualquier entidad con decoradores de TypeORM.
import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { B2B_ENTITIES } from '../b2b.module';
import { CreateB2bSchema1710000000000 } from './1710000000000-CreateB2bSchema';

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

/** Extrae el SQL de cada CREATE TABLE del script, indexado por nombre de tabla. */
function createTableStatements(queries: string[]): Map<string, string> {
  const found = new Map<string, string>();
  for (const sql of queries) {
    const match = /CREATE TABLE IF NOT EXISTS "?([A-Za-z0-9_]+)"?\s*\(([\s\S]*)\)\s*$/.exec(sql.trim());
    if (match) found.set(match[1], sql);
  }
  return found;
}

describe('Migración CreateB2bSchema (baseline del esquema B2B)', () => {
  let dataSource: DataSource;
  let queries: string[] = [];
  let tables: Map<string, string>;

  beforeAll(async () => {
    // buildMetadatas() construye la metadata sin abrir conexión a la base.
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: B2B_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;

    queries = [];
    await new CreateB2bSchema1710000000000().up(recordingQueryRunner(queries));
    tables = createTableStatements(queries);
  });

  it('ejecuta al menos un CREATE TABLE', () => {
    expect(queries.length).toBeGreaterThan(0);
    expect(tables.size).toBeGreaterThan(0);
  });

  it('crea todas las tablas declaradas por las entidades B2B', () => {
    const expected = dataSource.entityMetadatas.map((meta) => meta.tableName).sort();
    expect(expected).toEqual([
      'b2b_availability_blocks',
      'b2b_booking_events',
      'b2b_bookings',
      'b2b_courts',
      'b2b_facilities',
      'b2b_notifications',
      'b2b_organizations',
      'b2b_roles',
      'b2b_shift_rules',
      'b2b_shifts',
      'b2b_user_roles',
      'b2b_users',
    ]);
    for (const tableName of expected) {
      expect(tables.has(tableName)).toBe(true);
    }
  });

  it('declara todas las columnas de cada entidad', () => {
    // Contacto de WhatsApp (#37): los 4 campos se agregan en la migración
    // aditiva 1710000000002-CreateB2bWhatsappContacts (ver su spec), no en el
    // baseline. El guard siguiente las registra para no exigirlas acá.
    const provisionedLater: Record<string, string[]> = {
      b2b_users: ['whatsappPhone', 'whatsappOptIn'],
      b2b_organizations: ['whatsappPhone', 'whatsappOptIn'],
    };
    const missing: string[] = [];
    let checked = 0;
    for (const meta of dataSource.entityMetadatas) {
      const sql = tables.get(meta.tableName);
      expect(sql).toBeDefined();
      for (const column of meta.columns) {
        checked += 1;
        const name = column.databaseName;
        const present = sql!.includes('"' + name + '"') || new RegExp('\\b' + name + '\\b').test(sql!);
        if (!present && !(provisionedLater[meta.tableName] ?? []).includes(name)) missing.push(meta.tableName + '.' + name);
      }
    }
    // Guarda contra un test vacío: se validan las columnas de las 11 entidades B2B.
    expect(checked).toBeGreaterThan(70);
    expect(missing).toEqual([]);
  });

  it('es idempotente: usa CREATE TABLE IF NOT EXISTS en todas las tablas', () => {
    for (const sql of queries) {
      if (/^\s*CREATE TABLE/i.test(sql.trim())) {
        expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS/);
      }
    }
  });

  it('protege la invariante de una sola reserva activa por turno', () => {
    const guard = queries.find((sql) => sql.includes('b2b_active_booking_per_shift'));
    expect(guard).toBeDefined();
    expect(guard).toContain('UNIQUE INDEX');
    expect(guard).toContain('PENDING');
    expect(guard).toContain('CONFIRMED');
  });

  it('mantiene el aislamiento multi-tenant: toda tabla operativa tiene organizationId', () => {
    const tenants = ['b2b_users', 'b2b_facilities', 'b2b_courts', 'b2b_shifts', 'b2b_bookings'];
    for (const table of tenants) {
      const sql = queries.find((statement) => statement.includes('CREATE TABLE IF NOT EXISTS ' + table + ' ('));
      expect(sql).toBeDefined();
      expect(sql).toContain('"organizationId"');
      expect(sql).toContain('REFERENCES b2b_organizations(id)');
    }
  });

  it('down elimina todas las tablas', async () => {
    const drops: string[] = [];
    await new CreateB2bSchema1710000000000().down(recordingQueryRunner(drops));
    expect(drops).toHaveLength(1);
    for (const table of ['b2b_booking_events', 'b2b_bookings', 'b2b_organizations', 'b2b_users', 'b2b_courts']) {
      expect(drops[0]).toContain(table);
    }
  });
});
