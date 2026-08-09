-- Таблица комментариев
CREATE TABLE IF NOT EXISTS "comments" (
  "id" SERIAL PRIMARY KEY,
  "target_type" VARCHAR(50) NOT NULL, -- post, event, article
  "target_id" INTEGER NOT NULL,
  "author_name" VARCHAR(100) NOT NULL,
  "content" TEXT NOT NULL,
  "image" VARCHAR(500),
  "parent_id" INTEGER REFERENCES "comments"("id") ON DELETE CASCADE,
  "is_approved" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS "comments_target_idx" ON "comments" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "comments_parent_idx" ON "comments" ("parent_id");
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments" ("created_at");
