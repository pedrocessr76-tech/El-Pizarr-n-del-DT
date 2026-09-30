import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateB2bPivotProfiles1710000000004 implements MigrationInterface {
  name = 'CreateB2bPivotProfiles1710000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "pivotAvailable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "pivotRole" varchar(16) NOT NULL DEFAULT 'FIELD'`,
    );
    await queryRunner.query(
      `ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "pivotPositions" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_b2b_users_pivot_available ON b2b_users ("pivotAvailable", "fullName")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_b2b_users_pivot_available');
    await queryRunner.query(
      'ALTER TABLE b2b_users DROP COLUMN IF EXISTS "pivotPositions", DROP COLUMN IF EXISTS "pivotRole", DROP COLUMN IF EXISTS "pivotAvailable"',
    );
  }
}
