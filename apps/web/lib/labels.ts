/**
 * Подписи к значениям enum из БД (posts.event_type, event_format, participation_type).
 * Сам контент приходит из базы, здесь только перевод кодов в читаемый текст.
 */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  single: "Единичный",
  "multi-stage": "Многоэтапный"
};

export const PARTICIPATION_LABELS: Record<string, string> = {
  individual: "Индивидуальный",
  mass: "Массовый"
};

export const EVENT_FORMAT_LABELS: Record<string, string> = {
  poll: "Опрос",
  riddle: "Загадка",
  puzzle: "Пазл",
  crossword: "Кроссворд",
  quest: "Бродилка",
  creative: "Творческое задание",
  choice: "Выбор варианта",
  "word-search": "Поиск слов",
  "image-search": "Поиск изображений"
};

export function labelFor(
  dictionary: Record<string, string>,
  value?: string | null
): string | null {
  if (!value) return null;
  return dictionary[value] || value;
}
