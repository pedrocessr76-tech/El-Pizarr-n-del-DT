import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { B2B_ENTITIES } from '../b2b.module';
import { AddB2bReminderChannels1710000000005 } from './1710000000005-AddB2bReminderChannels';

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

describe('Migración AddB2bReminderChannels (recordatorios bicanal)', () => {
  let dataSource: DataSource;
  let up: string[];

  beforeAll(async () => {
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: B2B_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;

    up = [];
    await new AddB2bReminderChannels1710000000005().up(recordingQueryRunner(up));
  });

  it('agrega emailReminderIntervalsMinutes con default [1440]', () => {
    const add = up.find((sql) => sql.includes('ADD COLUMN IF NOT EXISTS "emailReminderIntervalsMinutes"'));
    expect(add).toBeDefined();
    expect(add).toContain("'[1440]'::jsonb");
  });

  it('deja la anticipación corta de WhatsApp en [30]', () => {
    const update = up.find((sql) => sql.includes('UPDATE b2b_organizations'));
    expect(update).toBeDefined();
    expect(update).toContain("'[30]'::jsonb");
  });

  it('detecta las anticipaciones previas como elementos del array, no como claves', () => {
    // El operador `?` de jsonb consulta claves de un objeto: sobre el array de
    // anticipaciones nunca verdadero, así que el backfill no habría corrido.
    const update = up.find((sql) => sql.includes('UPDATE b2b_organizations'));
    expect(update).toContain(`@> '["1440"]'::jsonb`);
    expect(update).toContain(`@> '["60"]'::jsonb`);
    expect(update).not.toMatch(/"?\w*ReminderIntervalsMinutes"?\s*\?\s*'/);
  });

  it('agrega channel a las entregas y completa el backfill antes de cambiar la clave', () => {
    const addColumn = up.findIndex((sql) => sql.includes('ADD COLUMN IF NOT EXISTS "channel"'));
    const backfill = up.findIndex((sql) => sql.includes(`SET "channel" = 'whatsapp'`));
    const newIndex = up.findIndex((sql) => sql.includes('CREATE UNIQUE INDEX'));
    expect(addColumn).toBeGreaterThanOrEqual(0);
    expect(backfill).toBeGreaterThan(addColumn);
    expect(newIndex).toBeGreaterThan(backfill);
  });

  it('reemplaza la clave única por reserva, canal y anticipación', () => {
    const drop = up.find((sql) => sql.includes('DROP CONSTRAINT IF EXISTS uq_b2b_booking_reminder_interval'));
    const create = up.find((sql) => sql.includes('CREATE UNIQUE INDEX'));
    expect(drop).toBeDefined();
    expect(create).toContain('("bookingId", "channel", "minutesBefore")');
  });

  it('la entidad declara channel con default whatsapp y el índice por los tres campos', () => {
    const reminder = dataSource.entityMetadatas.find((m) => m.tableName === 'b2b_booking_reminders');
    expect(reminder).toBeDefined();
    const channel = reminder!.columns.find((column) => column.databaseName === 'channel');
    expect(channel).toBeDefined();
    expect(channel!.default).toBe('whatsapp');
    expect(reminder!.indices.some((index) => index.isUnique && index.columns.map((c) => c.databaseName).join(',') === 'bookingId,channel,minutesBefore')).toBe(true);
  });

  it('la organización declara las dos listas de anticipaciones', () => {
    const organization = dataSource.entityMetadatas.find((m) => m.tableName === 'b2b_organizations');
    const email = organization!.columns.find((column) => column.databaseName === 'emailReminderIntervalsMinutes');
    const whatsapp = organization!.columns.find((column) => column.databaseName === 'whatsappReminderIntervalsMinutes');
    expect(email).toBeDefined();
    expect(whatsapp).toBeDefined();
    // El default de una columna jsonb es una función: hay que invocarla.
    const emailDefault = email!.default as unknown as () => string;
    const whatsappDefault = whatsapp!.default as unknown as () => string;
    expect(emailDefault()).toContain('[1440]');
    expect(whatsappDefault()).toContain('[30]');
  });

  it('down restaura la clave anterior, deduplica y dropea lo agregado', async () => {
    const down: string[] = [];
    await new AddB2bReminderChannels1710000000005().down(recordingQueryRunner(down));
    const joined = down.join('\n');

    expect(joined).toContain('DROP INDEX IF EXISTS "IDX_b2b_booking_reminders_channel"');
    expect(joined).toContain('DELETE FROM b2b_booking_reminders');
    expect(joined).toContain('ADD CONSTRAINT uq_b2b_booking_reminder_interval UNIQUE ("bookingId", "minutesBefore")');
    expect(joined).toContain('DROP COLUMN IF EXISTS "channel"');
    expect(joined).toContain('DROP COLUMN IF EXISTS "emailReminderIntervalsMinutes"');
  });
});
