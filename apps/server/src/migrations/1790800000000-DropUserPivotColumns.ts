import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El jugador pivote es una función del Sistema Canchas, no del Pizarron del DT:
 * el perfil pasó a vivir en b2b_users (1710000000004-CreateB2bPivotProfiles). La
 * migración 1790700000000-PivotProfiles que agregaba esas columnas a `users` ya se
 * ejecutó en bases migradas, y TypeORM no vuelve a correr migraciones registradas,
 * así que sin esta limpieza quedarían tres columnas huérfanas (con su índice) en
 * `users`. Es idempotente: en bases nuevas, donde nunca se crearon, no hace nada.
 */
export class DropUserPivotColumns1790800000000 implements MigrationInterface {
  name = 'DropUserPivotColumns1790800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_pivot_available');
    await queryRunner.query(
      'ALTER TABLE users DROP COLUMN IF EXISTS "pivotPositions", DROP COLUMN IF EXISTS "pivotRole", DROP COLUMN IF EXISTS "pivotAvailable"',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "pivotAvailable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "pivotRole" varchar(16) NOT NULL DEFAULT 'FIELD'`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "pivotPositions" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_users_pivot_available ON users ("pivotAvailable", "username")',
    );
  }
}
