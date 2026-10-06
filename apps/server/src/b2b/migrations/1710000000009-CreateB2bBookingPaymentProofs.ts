import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateB2bBookingPaymentProofs1710000000009 implements MigrationInterface {
  name = 'CreateB2bBookingPaymentProofs1710000000009';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE b2b_booking_payment_proofs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingId" uuid NOT NULL UNIQUE REFERENCES b2b_bookings(id) ON DELETE CASCADE,
        "uploadedBy" uuid NOT NULL REFERENCES b2b_users(id),
        "paymentType" varchar(16) NOT NULL CHECK ("paymentType" IN ('DEPOSIT', 'FULL')),
        "paymentMethod" varchar(20) NOT NULL CHECK ("paymentMethod" IN ('MERCADO_PAGO', 'TRANSFER')),
        "fileName" varchar(255) NOT NULL,
        "contentType" varchar(40) NOT NULL CHECK ("contentType" IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
        "fileData" bytea NOT NULL,
        "uploadedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS b2b_booking_payment_proofs');
  }
}