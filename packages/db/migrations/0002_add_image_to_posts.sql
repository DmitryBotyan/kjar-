-- Добавление поля image в таблицу posts
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "image" varchar(500);
