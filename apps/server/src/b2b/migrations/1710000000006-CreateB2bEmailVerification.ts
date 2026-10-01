import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Verificación obligatoria de email (#verificacion-de-email).
 *
 * - `emailVerified` arranca en `false` sin excepción: la decisión fue no dar
 *   grace period a las cuentas existentes porque son datos de prueba. Cualquier
 *   cuenta en producción que necesite salvage se marca a mano con un UPDATE.
 * - El token se borra en cascada con el usuario: sin dueño no hay a quién
 *   verificar y las filas solo ocupan lugar.
 */
export class CreateB2bEmailVerification1710000000006 implements MigrationInterface {
  name = 'CreateB2bEmailVerification1710000000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE b2b_users ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS b2b_email_verification_tokens (
         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
         "userId" uuid NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
         "tokenHash" varchar(64) NOT NULL,
         "expiresAt" timestamptz NOT NULL,
         "usedAt" timestamptz,
         attempts integer NOT NULL DEFAULT 0,
         "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_b2b_email_verification_token_hash" ON b2b_email_verification_tokens ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b2b_email_verification_token_user_used" ON b2b_email_verification_tokens ("userId", "usedAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS b2b_email_verification_tokens`);
    await queryRunner.query(`ALTER TABLE b2b_users DROP COLUMN IF EXISTS "emailVerified"`);
  }
}