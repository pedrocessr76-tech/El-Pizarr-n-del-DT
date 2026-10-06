import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateB2bPivotChats1710000000007 implements MigrationInterface {
  name = 'CreateB2bPivotChats1710000000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE b2b_pivot_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "requesterUserId" uuid NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
        "requesterOrganizationId" uuid NOT NULL REFERENCES b2b_organizations(id) ON DELETE CASCADE,
        "pivotUserId" uuid NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
        "pivotOrganizationId" uuid NOT NULL REFERENCES b2b_organizations(id) ON DELETE CASCADE,
        "bookingId" uuid,
        status varchar(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
        "respondedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastMessageAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK ("requesterUserId" <> "pivotUserId")
      )
    `);
    await queryRunner.query('CREATE INDEX idx_b2b_pivot_requester_recent ON b2b_pivot_requests ("requesterUserId", "lastMessageAt" DESC)');
    await queryRunner.query('CREATE INDEX idx_b2b_pivot_recipient_recent ON b2b_pivot_requests ("pivotUserId", "lastMessageAt" DESC)');
    await queryRunner.query(`
      CREATE TABLE b2b_pivot_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" uuid NOT NULL REFERENCES b2b_pivot_requests(id) ON DELETE CASCADE,
        "senderUserId" uuid NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
        body varchar(1000) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query('CREATE INDEX idx_b2b_pivot_message_recent ON b2b_pivot_messages ("requestId", "createdAt")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS b2b_pivot_messages');
    await queryRunner.query('DROP TABLE IF EXISTS b2b_pivot_requests');
  }
}