import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB2bUserLastLoginAt1710000000010 implements MigrationInterface {
  name = 'AddB2bUserLastLoginAt1710000000010';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE b2b_users DROP COLUMN IF EXISTS "lastLoginAt"');
    await queryRunner.query('ALTER TABLE b2b_users DROP COLUMN IF EXISTS "updatedAt"');
  }
}