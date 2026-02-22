import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQueryOptimizationIndexes1730200000000 implements MigrationInterface {
  name = 'AddQueryOptimizationIndexes1730200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_username" ON "users" ("username")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_createdAt" ON "users" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_deals_buyerUserId" ON "deals" ("buyerUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_deals_sellerUserId" ON "deals" ("sellerUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_requests_userId" ON "moderation_requests" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_requests_telegramId" ON "moderation_requests" ("telegramId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_moderation_requests_telegramId_createdAt" ON "moderation_requests" ("telegramId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_moderation_requests_telegramId_createdAt"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_moderation_requests_telegramId"`);
    await queryRunner.query(`DROP INDEX "IDX_moderation_requests_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_deals_sellerUserId"`);
    await queryRunner.query(`DROP INDEX "IDX_deals_buyerUserId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
  }
}
