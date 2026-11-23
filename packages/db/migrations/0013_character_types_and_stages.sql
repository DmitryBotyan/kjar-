-- Правки заказчицы от 23.11.2026: подтип и дата начала игры у кьяра,
-- типы по каждому роду, новые значения родства.

ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "subtype" varchar(100);--> statement-breakpoint
-- Пусто: дата берётся из created_at. Заполнено: правленая дата «в игре с»
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "started_at" timestamp;--> statement-breakpoint

INSERT INTO "dictionaries" ("group_key", "code", "label", "sort_order") VALUES
	('character_kinship', 'Духовный брат', 'Духовный брат', 60),
	('character_kinship', 'Духовная сестра', 'Духовная сестра', 70),

	('character_subtype', 'Сокровенный', 'Сокровенный', 10),
	('character_subtype', 'Миражный', 'Миражный', 20),

	('character_type_drevnie', 'Вельд', 'Вельд', 10),
	('character_type_drevnie', 'Колосс', 'Колосс', 20),
	('character_type_drevnie', 'Ас', 'Ас', 30),

	('character_type_drevnerogie', 'Глас Корней', 'Глас Корней', 10),
	('character_type_drevnerogie', 'Хвойный Хранитель', 'Хвойный Хранитель', 20),
	('character_type_drevnerogie', 'Старейшина', 'Старейшина', 30),

	('character_type_bjorngviny', 'Жесткое', 'Жесткое', 10),
	('character_type_bjorngviny', 'Мягкое', 'Мягкое', 20),

	('character_type_kompanony', 'Харг', 'Харг', 10),
	('character_type_kompanony', 'Отам', 'Отам', 20),
	('character_type_kompanony', 'Кветан', 'Кветан', 30),
	('character_type_kompanony', 'Особый', 'Особый', 40)
ON CONFLICT ("group_key", "code") DO NOTHING;