import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { B2B_ENTITIES } from '../b2b.module';
import { CreateB2bPivotChats1710000000007 } from './1710000000007-CreateB2bPivotChats';

function recordingQueryRunner(sink: string[]): QueryRunner {
  return { query: async (sql: string) => { sink.push(String(sql)); return undefined; } } as unknown as QueryRunner;
}

class MetadataOnlyDataSource extends DataSource {
  buildMetadata(): Promise<void> { return this.buildMetadatas(); }
}

describe('Migración CreateB2bPivotChats', () => {
  let dataSource: DataSource;
  let queries: string[];

  beforeAll(async () => {
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: B2B_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;
    queries = [];
    await new CreateB2bPivotChats1710000000007().up(recordingQueryRunner(queries));
  });

  it('crea tablas e índices de solicitudes y mensajes con claves de participantes', () => {
    expect(queries).toHaveLength(5);
    expect(queries[0]).toContain('CREATE TABLE b2b_pivot_requests');
    expect(queries[0]).toContain('"requesterUserId"');
    expect(queries[0]).toContain('"pivotUserId"');
    expect(queries[3]).toContain('CREATE TABLE b2b_pivot_messages');
    expect(queries[4]).toContain('idx_b2b_pivot_message_recent');
  });

  it('registra las dos entidades y sus índices en TypeORM', () => {
    expect(dataSource.entityMetadatas.find((metadata) => metadata.tableName === 'b2b_pivot_requests')).toBeDefined();
    expect(dataSource.entityMetadatas.find((metadata) => metadata.tableName === 'b2b_pivot_messages')).toBeDefined();
  });

  it('down elimina mensajes y solicitudes en orden seguro', async () => {
    const drops: string[] = [];
    await new CreateB2bPivotChats1710000000007().down(recordingQueryRunner(drops));
    expect(drops).toEqual([
      'DROP TABLE IF EXISTS b2b_pivot_messages',
      'DROP TABLE IF EXISTS b2b_pivot_requests',
    ]);
  });
});