import { MigrationInterface, QueryRunner } from 'typeorm';

export class PivotProfiles1790700000000 implements MigrationInterface {
  name = 'PivotProfiles1790700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "pivotAvailable" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "pivotRole" varchar(16) NOT NULL DEFAULT 'FIELD'`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "pivotPositions" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_pivot_available ON users ("pivotAvailable", "username")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_pivot_available');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS "pivotPositions", DROP COLUMN IF EXISTS "pivotRole", DROP COLUMN IF EXISTS "pivotAvailable"');
  }
}
