-- Заказчица попросила, чтобы теги и разделы всегда начинались с заглавной.
-- Новые значения приводит API при сохранении, здесь правятся уже заведённые.
UPDATE "tags"
SET "name" = upper(left("name", 1)) || substr("name", 2)
WHERE "name" <> upper(left("name", 1)) || substr("name", 2);--> statement-breakpoint
UPDATE "dictionaries"
SET "label" = upper(left("label", 1)) || substr("label", 2), "updated_at" = now()
WHERE "label" <> upper(left("label", 1)) || substr("label", 2);
