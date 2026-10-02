-- Стартовое наполнение справочников. Значения перенесены из кода фронтенда
-- один в один, чтобы сайт после миграции выглядел ровно так же, как до неё.
-- Дальше они правятся только через админку.
INSERT INTO "dictionaries" ("group_key", "code", "label", "sort_order") VALUES
	('character_role', 'Игрок', 'Игрок', 10),
	('character_role', 'НПС', 'НПС', 20),

	('character_status', 'Активна', 'Активна', 10),
	('character_status', 'Активен', 'Активен', 20),
	('character_status', 'На посту', 'На посту', 30),
	('character_status', 'В пути', 'В пути', 40),
	('character_status', 'В тени', 'В тени', 50),

	('character_species', 'Человек', 'Человек', 10),
	('character_species', 'Страж', 'Страж', 20),
	('character_species', 'Полукровка', 'Полукровка', 30),
	('character_species', 'Северный род', 'Северный род', 40),

	('character_meter', 'Здоровье', 'Здоровье', 10),
	('character_meter', 'Настроение', 'Настроение', 20),
	('character_meter', 'Сила', 'Сила', 30),
	('character_meter', 'Выносливость', 'Выносливость', 40),
	('character_meter', 'Ловкость', 'Ловкость', 50),

	('event_type', 'single', 'Единичный', 10),
	('event_type', 'multi-stage', 'Многоэтапный', 20),

	('event_format', 'poll', 'Опрос', 10),
	('event_format', 'riddle', 'Загадка', 20),
	('event_format', 'puzzle', 'Пазл', 30),
	('event_format', 'crossword', 'Кроссворд', 40),
	('event_format', 'quest', 'Бродилка', 50),
	('event_format', 'creative', 'Творческое задание', 60),
	('event_format', 'choice', 'Выбор варианта', 70),
	('event_format', 'word-search', 'Поиск слов', 80),
	('event_format', 'image-search', 'Поиск изображений', 90),

	('participation_type', 'individual', 'Индивидуальный', 10),
	('participation_type', 'mass', 'Массовый', 20),

	('article_era', 'Первая', 'Первая', 10),
	('article_era', 'Вторая', 'Вторая', 20),
	('article_era', 'Любая', 'Любая', 30),
	('article_era', 'Вне эпох', 'Вне эпох', 40),

	('thread_category', 'Лор', 'Лор', 10),
	('thread_category', 'Ивенты', 'Ивенты', 20),
	('thread_category', 'Исследования', 'Исследования', 30),
	('thread_category', 'Сообщество', 'Сообщество', 40),
	('thread_category', 'Ритуалы', 'Ритуалы', 50),
	('thread_category', 'Редактура', 'Редактура', 60),

	('contact_request_type', 'Вопрос', 'Вопрос', 10),
	('contact_request_type', 'Заявка на роль', 'Заявка на роль', 20),
	('contact_request_type', 'Предложение по лору', 'Предложение по лору', 30),
	('contact_request_type', 'Поддержка', 'Поддержка', 40)
ON CONFLICT ("group_key", "code") DO NOTHING;
--> statement-breakpoint
-- Эпохи админка раньше писала латиницей, а сид — кириллицей, из-за чего
-- на /lore появлялись два фильтра для одной эпохи.
UPDATE "articles" SET "era" = 'Первая' WHERE "era" = 'first';--> statement-breakpoint
UPDATE "articles" SET "era" = 'Вторая' WHERE "era" = 'second';--> statement-breakpoint
UPDATE "articles" SET "era" = 'Любая' WHERE "era" = 'any';--> statement-breakpoint
-- Тип обращения раньше приклеивался к теме префиксом «Тип: ...».
UPDATE "contact_requests" SET
	"request_type" = split_part("subject", ': ', 1),
	"subject" = substring("subject" from position(': ' in "subject") + 2)
WHERE "request_type" IS NULL
	AND split_part("subject", ': ', 1) IN (
		'Вопрос', 'Заявка на роль', 'Предложение по лору', 'Поддержка'
	);
