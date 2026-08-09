-- Добавление полей для ивентов в таблицу posts
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "is_event" boolean DEFAULT false NOT NULL;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_type" varchar(50);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_format" varchar(100);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "participation_type" varchar(50);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_stages" jsonb;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_config" jsonb;

-- Создание индексов для новых полей
CREATE INDEX IF NOT EXISTS "posts_is_event_idx" ON "posts"("is_event");
CREATE INDEX IF NOT EXISTS "posts_event_type_idx" ON "posts"("event_type");
CREATE INDEX IF NOT EXISTS "posts_event_format_idx" ON "posts"("event_format");
