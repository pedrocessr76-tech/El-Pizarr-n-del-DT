import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La v1 del esquema B2B (1710000000000) se desplegó antes de que existieran las
 * notificaciones, y luego la tabla b2b_notifications se agregó editando esa misma
 * migración ya ejecutada. TypeORM no vuelve a correr migraciones registradas, así
 * que en bases ya producidas la tabla nunca se creó. Esta migración la crea en
 * bases migradas; en bases nuevas es idempotente (IF NOT EXISTS).
 */
export class CreateB2bNotifications1710000000001 implements MigrationInterface {
  name = 'CreateB2bNotifications1710000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS b2b_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "organizationId" uuid NOT NULL REFERENCES b2b_organizations(id) ON DELETE CASCADE, "recipientUserId" uuid NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE, type varchar(40) NOT NULL, severity varchar(12) NOT NULL, title varchar(255) NOT NULL, body varchar(500) NOT NULL, metadata jsonb NOT NULL DEFAULT '{}', read boolean NOT NULL DEFAULT false, "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_b2b_notifications_recipient_created ON b2b_notifications ("recipientUserId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_b2b_notifications_recipient_read ON b2b_notifications ("recipientUserId", read)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS b2b_notifications');
  }
}