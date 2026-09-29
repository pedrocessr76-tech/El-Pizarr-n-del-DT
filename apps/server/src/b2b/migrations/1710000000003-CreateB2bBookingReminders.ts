import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateB2bBookingReminders1710000000003 implements MigrationInterface {
  name = 'CreateB2bBookingReminders1710000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE b2b_organizations ADD COLUMN IF NOT EXISTS "whatsappReminderIntervalsMinutes" jsonb NOT NULL DEFAULT '[1440, 60]'::jsonb`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS b2b_booking_reminders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingId" uuid NOT NULL REFERENCES b2b_bookings(id) ON DELETE CASCADE,
        "minutesBefore" integer NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'PROCESSING',
        attempts integer NOT NULL DEFAULT 1,
        provider varchar(40),
        "lastError" varchar(500),
        "processedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_b2b_booking_reminder_interval UNIQUE ("bookingId", "minutesBefore")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_b2b_booking_reminders_status_updated ON b2b_booking_reminders (status, "updatedAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS b2b_booking_reminders');
    await queryRunner.query(
      `ALTER TABLE b2b_organizations DROP COLUMN IF EXISTS "whatsappReminderIntervalsMinutes"`,
    );
  }
}
