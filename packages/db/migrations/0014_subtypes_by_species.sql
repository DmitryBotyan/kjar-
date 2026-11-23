-- Подтипы принадлежат разным родам: у Древних свои три ступени, у Дюнгаров
-- остаются прежние два значения. Общая группа характерна только для Дюнгаров.
INSERT INTO "dictionaries" ("group_key", "code", "label", "sort_order") VALUES
	('character_subtype_drevnie', 'Исконный', 'Исконный', 10),
	('character_subtype_drevnie', 'Сокровенный', 'Сокровенный', 20),
	('character_subtype_drevnie', 'Заповедный', 'Заповедный', 30)
ON CONFLICT ("group_key", "code") DO NOTHING;
