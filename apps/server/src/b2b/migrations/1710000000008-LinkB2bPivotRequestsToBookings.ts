import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkB2bPivotRequestsToBookings1710000000008 implements MigrationInterface {
  name = 'LinkB2bPivotRequestsToBookings1710000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE b2b_pivot_requests ADD COLUMN IF NOT EXISTS "bookingId" uuid');
    await queryRunner.query('ALTER TABLE b2b_pivot_requests ALTER COLUMN "bookingId" DROP NOT NULL');
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint constraint_row
          JOIN pg_attribute column_row
            ON column_row.attrelid = constraint_row.conrelid
           AND column_row.attnum = ANY(constraint_row.conkey)
          WHERE constraint_row.conrelid = 'b2b_pivot_requests'::regclass
            AND constraint_row.contype = 'f'
            AND column_row.attname = 'bookingId'
        ) THEN
          ALTER TABLE b2b_pivot_requests
            ADD CONSTRAINT fk_b2b_pivot_request_booking
            FOREIGN KEY ("bookingId") REFERENCES b2b_bookings(id) ON DELETE SET NULL;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE b2b_pivot_requests
        ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'PENDING'
    `);
    await queryRunner.query('ALTER TABLE b2b_pivot_requests ADD COLUMN IF NOT EXISTS "respondedAt" timestamptz');
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_b2b_pivot_booking_per_player
      ON b2b_pivot_requests ("bookingId", "pivotUserId") WHERE "bookingId" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_b2b_pivot_booking_per_player');
    await queryRunner.query('ALTER TABLE b2b_pivot_requests DROP CONSTRAINT IF EXISTS fk_b2b_pivot_request_booking');
    await queryRunner.query('ALTER TABLE b2b_pivot_requests DROP COLUMN IF EXISTS "respondedAt"');
    await queryRunner.query('ALTER TABLE b2b_pivot_requests DROP COLUMN IF EXISTS status');
    await queryRunner.query('ALTER TABLE b2b_pivot_requests DROP COLUMN IF EXISTS "bookingId"');
  }
}