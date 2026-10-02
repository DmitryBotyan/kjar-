import { fetchFromApi } from "./api";

/**
 * Справочники значений приходят из админки: роли и статусы кьяров, типы и
 * форматы ивентов, эпохи, разделы обсуждений. В коде остаются только имена
 * групп — сами значения и подписи живут в базе.
 */
export const DICTIONARY_GROUPS = [
  "character_role",
  "character_status",
  "character_species",
  "character_meter",
  "character_kinship",
  "event_type",
  "event_format",
  "participation_type",
  "article_era",
  "thread_category",
  "contact_request_type"
] as const;

export type DictionaryGroup = (typeof DICTIONARY_GROUPS)[number];

export type DictionaryEntry = {
  id: number;
  group: DictionaryGroup;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type DictionarySet = Record<DictionaryGroup, DictionaryEntry[]>;

function emptySet(): DictionarySet {
  return Object.fromEntries(
    DICTIONARY_GROUPS.map((group) => [group, [] as DictionaryEntry[]])
  ) as DictionarySet;
}

/**
 * Забирает все группы одним запросом: страницам обычно нужно две-три сразу,
 * а справочники небольшие.
 */
export async function getDictionarySet(): Promise<DictionarySet> {
  const result = emptySet();

  const response = await fetchFromApi<DictionaryEntry[]>("/dictionaries");

  for (const entry of response.data || []) {
    if (result[entry.group]) {
      result[entry.group].push(entry);
    }
  }

  return result;
}

export async function getDictionary(
  group: DictionaryGroup
): Promise<DictionaryEntry[]> {
  const response = await fetchFromApi<DictionaryEntry[]>(
    `/dictionaries?group=${encodeURIComponent(group)}`
  );
  return response.data || [];
}

/**
 * Подпись для кода. Значение, которого нет в справочнике, показывается как
 * есть: материал мог быть заведён до того, как значение убрали.
 */
export function labelFor(
  entries: DictionaryEntry[] | undefined,
  code?: string | null
): string | null {
  if (!code) return null;
  return entries?.find((entry) => entry.code === code)?.label || code;
}

export function codes(entries: DictionaryEntry[] | undefined): string[] {
  return (entries || []).map((entry) => entry.code);
}
