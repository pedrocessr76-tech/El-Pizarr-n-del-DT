import { QueryRunner } from 'typeorm';
import { LinkB2bPivotRequestsToBookings1710000000008 } from './1710000000008-LinkB2bPivotRequestsToBookings';

function recordingQueryRunner(sink: string[]): QueryRunner {
  return { query: async (sql: string) => { sink.push(String(sql)); return undefined; } } as unknown as QueryRunner;
}

describe('Migración LinkB2bPivotRequestsToBookings', () => {
  it('agrega bookingId nullable y completa estado/índice sin reemplazar filas legadas', async () => {
    const queries: string[] = [];
    await new LinkB2bPivotRequestsToBookings1710000000008().up(recordingQueryRunner(queries));

    expect(queries[0]).toContain('ADD COLUMN IF NOT EXISTS "bookingId" uuid');
    expect(queries[1]).toContain('ALTER COLUMN "bookingId" DROP NOT NULL');
    expect(queries.join('\n')).toContain("DEFAULT 'PENDING'");
    expect(queries.join('\n')).toContain('idx_b2b_pivot_booking_per_player');
    expect(queries.join('\n')).toContain('WHERE "bookingId" IS NOT NULL');
  });

  it('down elimina solo los cambios de enlace agregados', async () => {
    const queries: string[] = [];
    await new LinkB2bPivotRequestsToBookings1710000000008().down(recordingQueryRunner(queries));

    expect(queries).toHaveLength(5);
    expect(queries[0]).toContain('DROP INDEX');
    expect(queries[4]).toContain('DROP COLUMN IF EXISTS "bookingId"');
  });
});