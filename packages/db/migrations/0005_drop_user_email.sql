-- Отказ от хранения e-mail: вход по логину.
-- База на момент миграции пустая, поэтому переносить нечего.
DROP INDEX IF EXISTS "users_email_idx";

ALTER TABLE "users" DROP COLUMN IF EXISTS "email";

UPDATE "users" SET "username" = 'user_' || "id" WHERE "username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE ("username");

CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
