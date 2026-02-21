import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "telegramId" bigint NOT NULL,
        "username" character varying(255),
        "firstName" character varying(255),
        "lastName" character varying(255),
        "languageCode" character varying(20),
        "isPremium" boolean NOT NULL DEFAULT false,
        "verified" boolean NOT NULL DEFAULT false,
        "isScam" boolean NOT NULL DEFAULT false,
        "isBlocked" boolean NOT NULL DEFAULT false,
        "ratingManualDelta" float NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_telegramId" UNIQUE ("telegramId"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "adsActive" integer NOT NULL DEFAULT 0,
        "adsCompleted" integer NOT NULL DEFAULT 0,
        "adsHidden" integer NOT NULL DEFAULT 0,
        "dealsTotal" integer NOT NULL DEFAULT 0,
        "dealsSuccessful" integer NOT NULL DEFAULT 0,
        "dealsDisputed" integer NOT NULL DEFAULT 0,
        "activeDays" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_activity_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_user_activity" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_activity_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_labels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "defaultColor" character varying(7) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_labels_name" UNIQUE ("name"),
        CONSTRAINT "PK_user_labels" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_user_labels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "labelId" uuid NOT NULL,
        "customColor" character varying(7),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_user_labels_userId_labelId" UNIQUE ("userId", "labelId"),
        CONSTRAINT "PK_user_user_labels" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_user_labels_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_user_labels_labelId" FOREIGN KEY ("labelId") REFERENCES "user_labels"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_ad_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "adId" character varying(120) NOT NULL,
        "category" character varying(40),
        "titleCache" character varying(255),
        "priceCache" float,
        "status" character varying(40) NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_ad_links_userId_adId" UNIQUE ("userId", "adId"),
        CONSTRAINT "PK_user_ad_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_ad_links_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "profile_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "viewerUserId" uuid NOT NULL,
        "profileUserId" uuid NOT NULL,
        "viewedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profile_views" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profile_views_viewerUserId" FOREIGN KEY ("viewerUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_profile_views_profileUserId" FOREIGN KEY ("profileUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_profile_views_profileUserId_viewedAt" ON "profile_views" ("profileUserId", "viewedAt")
    `);
    await queryRunner.query(`
      CREATE TABLE "deals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "buyerUserId" uuid NOT NULL,
        "sellerUserId" uuid NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "amount" float NOT NULL DEFAULT 0,
        "closedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deals_buyerUserId" FOREIGN KEY ("buyerUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_deals_sellerUserId" FOREIGN KEY ("sellerUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "moderation_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "telegramId" bigint NOT NULL,
        "userId" uuid,
        "section" character varying(40) NOT NULL,
        "formData" jsonb NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "adminNote" text,
        "publishedItemId" character varying(120),
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_moderation_requests_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderation_requests_status_createdAt" ON "moderation_requests" ("status", "createdAt")
    `);
    await queryRunner.query(`
      CREATE TABLE "support_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "telegramId" bigint NOT NULL,
        "userId" uuid,
        "username" character varying(255),
        "message" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_support_requests_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "support_requests"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_moderation_requests_status_createdAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deals"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_profile_views_profileUserId_viewedAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "profile_views"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_ad_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_user_labels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_labels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_activity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
