import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpiresAtToModerationRequests1730100000000 implements MigrationInterface {
  name = 'AddExpiresAtToModerationRequests1730100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "moderation_requests"
      ADD COLUMN "expiresAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "moderation_requests"
      DROP COLUMN "expiresAt"
    `);
  }
}
