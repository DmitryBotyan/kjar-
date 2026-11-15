-- Правки заказчицы от 15.11.2026: новые поля под фильтры и анкеты и новые
-- наборы справочников. Старые значения справочников не удаляются, а
-- выключаются: на них могут ссылаться уже заведённые записи.

-- Вертикальная картинка для колоды; image остаётся картинкой страницы кьяра
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "portrait" varchar(500);--> statement-breakpoint

ALTER TABLE "normans" ADD COLUMN IF NOT EXISTS "gender" varchar(100);--> statement-breakpoint
ALTER TABLE "normans" ADD COLUMN IF NOT EXISTS "occupation" varchar(100);--> statement-breakpoint
ALTER TABLE "normans" ADD COLUMN IF NOT EXISTS "norman_type" varchar(100);--> statement-breakpoint
-- Мини-анкета: { "Добродушие": 7, ... }, шкалы задаёт справочник norman_trait
ALTER TABLE "normans" ADD COLUMN IF NOT EXISTS "traits_json" jsonb;--> statement-breakpoint

-- Раздел поста (фильтр «Раздел», «Расписание» и «Торговая площадь» в меню)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "section" varchar(100);--> statement-breakpoint
-- Для кого ивент: для одного вида или для всех
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_audience" varchar(100);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_section_idx" ON "posts" ("section");--> statement-breakpoint

-- Ссылки и картинки, приложенные к обращению
ALTER TABLE "contact_requests" ADD COLUMN IF NOT EXISTS "attachments" text;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD COLUMN IF NOT EXISTS "images_json" jsonb;--> statement-breakpoint

UPDATE "dictionaries" SET "is_active" = false
WHERE ("group_key" = 'character_role' AND "code" IN ('Игрок', 'НПС'))
   OR ("group_key" = 'character_species' AND "code" IN ('Человек', 'Страж', 'Полукровка', 'Северный род'))
   OR ("group_key" = 'event_type' AND "code" = 'single')
   OR ("group_key" = 'thread_category' AND "code" IN ('Исследования', 'Сообщество', 'Ритуалы', 'Редактура'))
   OR ("group_key" = 'contact_request_type' AND "code" IN ('Вопрос', 'Заявка на роль', 'Предложение по лору', 'Поддержка'));--> statement-breakpoint

-- Код multi-stage остаётся: по нему ивент показывает этапы
UPDATE "dictionaries" SET "label" = 'Многозадачный', "sort_order" = 30
WHERE "group_key" = 'event_type' AND "code" = 'multi-stage';--> statement-breakpoint
UPDATE "dictionaries" SET "sort_order" = 110 WHERE "group_key" = 'thread_category' AND "code" = 'Лор';--> statement-breakpoint
UPDATE "dictionaries" SET "sort_order" = 130 WHERE "group_key" = 'thread_category' AND "code" = 'Ивенты';--> statement-breakpoint
UPDATE "dictionaries" SET "label" = 'Общий'
WHERE "group_key" = 'participation_type' AND "code" = 'mass';--> statement-breakpoint

INSERT INTO "dictionaries" ("group_key", "code", "label", "sort_order") VALUES
	('character_role', 'Обычный', 'Обычный', 110),
	('character_role', 'Особый', 'Особый', 120),
	('character_role', 'Лорный', 'Лорный', 130),
	('character_role', 'Ас', 'Ас', 140),

	('character_gender', 'Самка', 'Самка', 10),
	('character_gender', 'Самец', 'Самец', 20),
	('character_gender', 'Бесполый', 'Бесполый', 30),
	('character_gender', 'Кьярчонок самка', 'Кьярчонок самка', 40),
	('character_gender', 'Кьярчонок самец', 'Кьярчонок самец', 50),
	('character_gender', 'Кьярчонок', 'Кьярчонок', 60),

	('character_species', 'Кьяры', 'Кьяры', 110),
	('character_species', 'Кьярчата', 'Кьярчата', 120),
	('character_species', 'Древние', 'Древние', 130),
	('character_species', 'Древнерогие', 'Древнерогие', 140),
	('character_species', 'Бьёрнгвины', 'Бьёрнгвины', 150),
	('character_species', 'Дюнгары', 'Дюнгары', 160),
	('character_species', 'Компаньоны', 'Компаньоны', 170),

	('norman_gender', 'Мужчина', 'Мужчина', 10),
	('norman_gender', 'Женщина', 'Женщина', 20),
	('norman_gender', 'Иное', 'Иное', 30),

	('norman_occupation', 'Пастух', 'Пастух', 10),
	('norman_occupation', 'Землепашец', 'Землепашец', 20),
	('norman_occupation', 'Охотник', 'Охотник', 30),
	('norman_occupation', 'Рыболов', 'Рыболов', 40),
	('norman_occupation', 'Ткач', 'Ткач', 50),
	('norman_occupation', 'Горняк', 'Горняк', 60),
	('norman_occupation', 'Кузнец', 'Кузнец', 70),
	('norman_occupation', 'Древодел', 'Древодел', 80),
	('norman_occupation', 'Конюх', 'Конюх', 90),
	('norman_occupation', 'Золотарь', 'Золотарь', 100),
	('norman_occupation', 'Наблюдатель', 'Наблюдатель', 110),
	('norman_occupation', 'Торговец', 'Торговец', 120),
	('norman_occupation', 'Провидец', 'Провидец', 130),
	('norman_occupation', 'Отрок', 'Отрок', 140),
	('norman_occupation', 'Чужеборец', 'Чужеборец', 150),
	('norman_occupation', 'Берсерк', 'Берсерк', 160),
	('norman_occupation', 'Блуд', 'Блуд', 170),
	('norman_occupation', 'Травник', 'Травник', 180),
	('norman_occupation', 'Целитель', 'Целитель', 190),
	('norman_occupation', 'Ворожей', 'Ворожей', 200),
	('norman_occupation', 'Вуд', 'Вуд', 210),
	('norman_occupation', 'Прочее', 'Прочее', 220),

	('norman_type', 'Тьорн', 'Тьорн', 10),
	('norman_type', 'Норманн', 'Норманн', 20),
	('norman_type', 'Вуд', 'Вуд', 30),

	('norman_trait', 'Добродушие', 'Добродушие', 10),
	('norman_trait', 'Сдержанность', 'Сдержанность', 20),
	('norman_trait', 'Жестокость/Хладнокровие', 'Жестокость/Хладнокровие', 30),
	('norman_trait', 'Самолюбие', 'Самолюбие', 40),
	('norman_trait', 'Верность', 'Верность', 50),
	('norman_trait', 'Скромность', 'Скромность', 60),
	('norman_trait', 'Отзывчивость', 'Отзывчивость', 70),
	('norman_trait', 'Эмпатия', 'Эмпатия', 80),
	('norman_trait', 'Контроль гнева', 'Контроль гнева', 90),
	('norman_trait', 'Стрессоустойчивость', 'Стрессоустойчивость', 100),

	('post_section', 'kjars', 'Кьяры (тихоходы, древние, дюнгары)', 10),
	('post_section', 'rules', 'Правила', 20),
	('post_section', 'schedule', 'Расписание', 30),
	('post_section', 'villages', 'Столица и деревни', 40),
	('post_section', 'beasts', 'Иные звери', 50),
	('post_section', 'market', 'Торговая площадь', 60),
	('post_section', 'updates', 'Иные обновления', 70),

	('event_type', 'contest', 'Конкурс', 10),
	('event_type', 'lottery', 'Лотерея', 20),

	('event_audience', 'species', 'Видовой', 10),
	('event_audience', 'all', 'Для всех', 20),

	('thread_category', 'Правила', 'Правила', 120),
	('thread_category', 'Кьяры', 'Кьяры', 140),
	('thread_category', 'Звери', 'Звери', 150),
	('thread_category', 'Торговая площадь', 'Торговая площадь', 160),
	('thread_category', 'Норманны', 'Норманны', 170),
	('thread_category', 'Беседа', 'Беседа', 180),

	('contact_request_type', 'Заявка вступления в Большой Дом', 'Заявка вступления в Большой Дом', 110),
	('contact_request_type', 'Вопрос / Замечание', 'Вопрос / Замечание', 120),
	('contact_request_type', 'Помощь', 'Помощь', 130),
	('contact_request_type', 'Предложение для проекта', 'Предложение для проекта', 140),
	('contact_request_type', 'Просьба по поводу своего кьяра/норманна', 'Просьба по поводу своего кьяра/норманна', 150)
ON CONFLICT ("group_key", "code") DO NOTHING;--> statement-breakpoint

-- Категории и теги свода по списку заказчицы
INSERT INTO "categories" ("slug", "name") VALUES
	('kjars', 'Кьяры'),
	('normans', 'Норманны'),
	('heimsvald', 'Хеймсвальд'),
	('bases', 'Базы')
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
INSERT INTO "tags" ("slug", "name") VALUES
	('kjars', 'кьяры'),
	('normans', 'норманны'),
	('drevnerogie', 'древнерогие'),
	('bjorngviny', 'бьёрнгвины'),
	('dyungary', 'дюнгары (песчаные кьяры)'),
	('tjorny', 'тьорны'),
	('stolitsa', 'столица'),
	('derevni', 'деревни'),
	('bazy-kjarov', 'базы кьяров'),
	('bazy-bjorngvinov', 'базы бьёрнгвинов'),
	('bazy-drevnerogih', 'базы древнерогих'),
	('bazy-drevnih', 'базы древних'),
	('bazy-dyungarov', 'базы дюнгаров'),
	('kompanony', 'компаньоны'),
	('drevnie', 'древние'),
	('kjarchata', 'кьярчата'),
	('lor', 'лор'),
	('torgovaya-ploshchad', 'торговая площадь'),
	('flora', 'флора'),
	('fauna', 'фауна'),
	('karta', 'карта'),
	('fraktsiya-kjarov', 'фракция (кьяров)'),
	('fraktsiya-normannov', 'фракция (норманнов)'),
	('lornye-kjary', 'лорные кьяры'),
	('asy', 'асы')
ON CONFLICT ("slug") DO NOTHING;
