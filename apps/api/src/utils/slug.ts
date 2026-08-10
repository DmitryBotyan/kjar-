// Slug из русского заголовка. Прошлая версия резала всё, что не \w,
// а кириллица под \w не попадает — русские названия давали пустую строку.
// Поэтому сначала транслитерация, потом чистка.

const RU_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya"
};

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .split("")
    .map((char) => (char in RU_TO_LATIN ? RU_TO_LATIN[char] : char))
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);

  // Заголовок мог состоять только из символов, которые не переносятся в slug
  return base || `id-${Date.now().toString(36)}`;
}

/**
 * Подбирает свободный slug: к занятому добавляет -2, -3 и так далее.
 * `isTaken` проверяет занятость в нужной таблице.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 2;

  while (await isTaken(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
    // Защита от бесконечного цикла, если проверка всегда возвращает true
    if (suffix > 200) {
      candidate = `${root}-${Date.now().toString(36)}`;
      break;
    }
  }

  return candidate;
}
