"use client";

import { useDictionary } from "@/lib/useDictionaries";
import type { DictionaryGroup } from "@/lib/dictionaries";

type DictionarySelectProps = {
  group: DictionaryGroup;
  id: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  /** Подпись пустого варианта; без неё поле обязательно к заполнению */
  emptyLabel?: string;
  className?: string;
};

/**
 * Селект, варианты которого приходят из справочника. Раньше каждый такой
 * список был расписан в форме руками, и подписи расходились между админкой
 * и сайтом.
 */
export default function DictionarySelect({
  group,
  id,
  name,
  defaultValue,
  required,
  emptyLabel,
  className = "kjar-select"
}: DictionarySelectProps) {
  const { entries, loading, error } = useDictionary(group);

  // Значение, снятое с публикации, всё ещё может стоять у старой записи —
  // показываем его, чтобы правка формы его не затёрла.
  const missing =
    defaultValue && !entries.some((entry) => entry.code === defaultValue)
      ? defaultValue
      : null;

  if (error) {
    return (
      <select className={className} id={id} name={name} defaultValue={defaultValue || ""}>
        <option value={defaultValue || ""}>
          {defaultValue || "Справочник недоступен"}
        </option>
      </select>
    );
  }

  return (
    <select
      className={className}
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue || ""}
      disabled={loading && entries.length === 0}
      key={`${group}-${entries.length}-${defaultValue || ""}`}
    >
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {missing && <option value={missing}>{missing} (вне справочника)</option>}
      {entries.map((entry) => (
        <option key={entry.code} value={entry.code}>
          {entry.label}
        </option>
      ))}
    </select>
  );
}
