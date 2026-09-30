import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Recordatorios bicanal (#34). El diseño anterior suponía un único canal
 * automático de WhatsApp; hoy el aviso con antelación sale por email y el
 * aviso corto lo despacha el staff a mano desde el dashboard.
 *
 * - `emailReminderIntervalsMinutes`: anticipaciones que el servidor envía solo.
 * - `whatsappReminderIntervalsMinutes`: pasa a `[30]`, la anticipación corta
 *   que el panel ofrece para despacho manual.
 * - `channel` en la tabla de entregas: la clave única pasa a ser por reserva,
 *   canal y anticipación, para que el mismo aviso exista en los dos canales
 *   sin colisionar.
 */
export class AddB2bReminderChannels1710000000005 implements MigrationInterface {
  name = 'AddB2bReminderChannels1710000000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE b2b_organizations ADD COLUMN "emailReminderIntervalsMinutes" jsonb NOT NULL DEFAULT '[1440]'::jsonb`,
    );
    // Los valores previos incluían 1440 y 60. 1440 pasa a ser de email; en
    // WhatsApp queda solo la anticipación corta que el staff despacha.
    // El backfill matchea por contención: `?` de jsonb consulta claves de objeto,
    // no elementos de un array, y sobre este array nunca sería verdadero.
    await queryRunner.query(
      `UPDATE b2b_organizations SET "whatsappReminderIntervalsMinutes" = '[30]'::jsonb
       WHERE ("whatsappReminderIntervalsMinutes" @> '["1440"]'::jsonb OR "whatsappReminderIntervalsMinutes" @> '["60"]'::jsonb)`,
    );

    await queryRunner.query(
      `ALTER TABLE b2b_booking_reminders ADD COLUMN "channel" varchar(20) NOT NULL DEFAULT 'whatsapp'`,
    );
    // Backfill explícito antes de volver única la clave por canal.
    await queryRunner.query(`UPDATE b2b_booking_reminders SET "channel" = 'whatsapp' WHERE "channel" IS NULL`);

    await queryRunner.query(
      `ALTER TABLE b2b_booking_reminders DROP CONSTRAINT IF EXISTS uq_b2b_booking_reminder_interval`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_b2b_booking_reminders_channel"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_b2b_booking_reminders_channel" ON b2b_booking_reminders ("bookingId", "channel", "minutesBefore")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_b2b_booking_reminders_channel"`);
    // Si el mismo aviso existe en los dos canales, la clave anterior no puede
    // representarlos: se queda el registro más reciente de cada anticipación.
    await queryRunner.query(
      `DELETE FROM b2b_booking_reminders a USING b2b_booking_reminders b
       WHERE a."bookingId" = b."bookingId" AND a."minutesBefore" = b."minutesBefore"
         AND (a."updatedAt", a.id) < (b."updatedAt", b.id)`,
    );
    await queryRunner.query(`ALTER TABLE b2b_booking_reminders DROP CONSTRAINT IF EXISTS uq_b2b_booking_reminder_interval`);
    await queryRunner.query(
      `ALTER TABLE b2b_booking_reminders ADD CONSTRAINT uq_b2b_booking_reminder_interval UNIQUE ("bookingId", "minutesBefore")`,
    );
    await queryRunner.query(
      `ALTER TABLE b2b_booking_reminders DROP COLUMN "channel"`,
    );
    await queryRunner.query(
      `ALTER TABLE b2b_organizations DROP COLUMN "emailReminderIntervalsMinutes"`,
    );
  }
}
