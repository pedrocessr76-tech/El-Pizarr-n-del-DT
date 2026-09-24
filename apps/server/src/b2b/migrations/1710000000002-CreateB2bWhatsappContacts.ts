import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Contacto de WhatsApp en Sistema Canchas (#37): teléfono (E.164) y
 * consentimiento explícito para envíos, en usuarios y organizaciones.
 * Aditiva y no destructiva para bases con datos (ADD COLUMN nullable / default).
 */
export class CreateB2bWhatsappContacts1710000000002 implements MigrationInterface {
  name = 'CreateB2bWhatsappContacts1710000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "whatsappPhone" varchar(20)`);
    await queryRunner.query(`ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "whatsappOptIn" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE b2b_organizations ADD COLUMN IF NOT EXISTS "whatsappPhone" varchar(20)`);
    await queryRunner.query(`ALTER TABLE b2b_organizations ADD COLUMN IF NOT EXISTS "whatsappOptIn" boolean NOT NULL DEFAULT false`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE b2b_users DROP COLUMN IF EXISTS "whatsappPhone"`);
    await queryRunner.query(`ALTER TABLE b2b_users DROP COLUMN IF EXISTS "whatsappOptIn"`);
    await queryRunner.query(`ALTER TABLE b2b_organizations DROP COLUMN IF EXISTS "whatsappPhone"`);
    await queryRunner.query(`ALTER TABLE b2b_organizations DROP COLUMN IF EXISTS "whatsappOptIn"`);
  }
}