CREATE TABLE IF NOT EXISTS "normans" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(200) NOT NULL,
	"summary" text,
	"description" text,
	"image" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "normans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "tjorn_id" integer REFERENCES "normans"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "favorite" varchar(300);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "features" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "achievements_json" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "characters_tjorn_idx" ON "characters" ("tjorn_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "character_works" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
	"author_name" varchar(100) NOT NULL,
	"title" varchar(200),
	"image" varchar(500) NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "character_works_character_idx" ON "character_works" ("character_id");--> statement-breakpoint
-- Работы присылают сами игроки без входа, поэтому на сайт они попадают
-- только после одобрения в админке
CREATE INDEX IF NOT EXISTS "character_works_approved_idx" ON "character_works" ("is_approved");--> statement-breakpoint
INSERT INTO "dictionaries" ("group_key", "code", "label", "sort_order") VALUES
	('character_kinship', 'Мать', 'Мать', 10),
	('character_kinship', 'Отец', 'Отец', 20),
	('character_kinship', 'Брат', 'Брат', 30),
	('character_kinship', 'Сестра', 'Сестра', 40),
	('character_kinship', 'Потомок', 'Потомок', 50)
ON CONFLICT ("group_key", "code") DO NOTHING;
