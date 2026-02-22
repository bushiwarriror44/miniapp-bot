-- Run this ONCE if your database already has tables (users, moderation_requests, etc.)
-- but the "migrations" table is empty or missing. It marks the InitialSchema migration
-- as already executed so that "npm run migration:run" will only run the remaining
-- migrations (AddExpiresAtToModerationRequests, AddQueryOptimizationIndexes).
--
-- Usage: psql -U YOUR_DB_USER -d miniapp_bot -f scripts/mark-initial-schema-run.sql

INSERT INTO migrations (timestamp, name)
SELECT 1730000000000, 'InitialSchema1730000000000'
WHERE NOT EXISTS (SELECT 1 FROM migrations WHERE name = 'InitialSchema1730000000000');
