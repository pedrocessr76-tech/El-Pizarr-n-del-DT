import { QueryRunner } from 'typeorm';
import { CreateB2bBookingPaymentProofs1710000000009 } from './1710000000009-CreateB2bBookingPaymentProofs';

function recordingQueryRunner(sink: string[]): QueryRunner {
  return { query: async (sql: string) => { sink.push(String(sql)); return undefined; } } as unknown as QueryRunner;
}

describe('Migración CreateB2bBookingPaymentProofs', () => {
  it('crea comprobantes relacionados a una reserva y restringe tipos de archivo y pago', async () => {
    const queries: string[] = [];
    await new CreateB2bBookingPaymentProofs1710000000009().up(recordingQueryRunner(queries));

    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('CREATE TABLE b2b_booking_payment_proofs');
    expect(queries[0]).toContain('"bookingId" uuid NOT NULL UNIQUE');
    expect(queries[0]).toContain('"fileData" bytea NOT NULL');
    expect(queries[0]).toContain("'DEPOSIT', 'FULL'");
    expect(queries[0]).toContain("'application/pdf'");
  });

  it('down elimina la tabla de comprobantes', async () => {
    const queries: string[] = [];
    await new CreateB2bBookingPaymentProofs1710000000009().down(recordingQueryRunner(queries));
    expect(queries).toEqual(['DROP TABLE IF EXISTS b2b_booking_payment_proofs']);
  });
});