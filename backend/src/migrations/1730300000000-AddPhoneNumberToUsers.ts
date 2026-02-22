import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumberToUsers1730300000000 implements MigrationInterface {
  name = 'AddPhoneNumberToUsers1730300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "phoneNumber" character varying(40)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "phoneNumber"
    `);
  }
}
