import { fetchFromApi } from "./api";

/**
 * Справочники значений приходят из админки: роли и статусы кьяров, типы и
 * форматы ивентов, эпохи, разделы обсуждений. В коде остаются только имена
 * групп, а сами значения и подписи живут в базе.
 */
export const DICTIONARY_GROUPS = [
  "character_role",
  "character_status",
  "character_species",
  "character_subtype",
  "character_meter",
  "character_kinship",
  "character_gender",
  "character_type_drevnie",
  "character_type_drevnerogie",
  "character_type_bjorngviny",
  "character_type_kompanony",
  "event_type",
  "event_format",
  "participation_type",
  "event_audience",
  "post_section",
  "norman_gender",
  "norman_occupation",
  "norman_type",
  "norman_trait",
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

/**
 * У каждого рода свой набор типов. Дюнгары пользуются группой character_role:
 * она была единственной до разделения, и на ней лежат уже заведённые карты.
 */
export const CHARACTER_TYPE_GROUPS: Record<string, DictionaryGroup> = {
  Древние: "character_type_drevnie",
  Древнерогие: "character_type_drevnerogie",
  Бьёрнгвины: "character_type_bjorngviny",
  Дюнгары: "character_role",
  Компаньоны: "character_type_kompanony"
};

/** Подпись типа: код может лежать в любой группе типов, а не только в role. */
export function typeLabel(
  set: DictionarySet | null | undefined,
  code?: string | null
): string | null {
  if (!code) return null;
  if (!set) return code;
  for (const group of Object.values(CHARACTER_TYPE_GROUPS)) {
    const match = set[group].find((entry) => entry.code === code);
    if (match) return match.label;
  }
  return code;
}
