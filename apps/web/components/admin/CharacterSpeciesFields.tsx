"use client";

import { useState } from "react";
import { useDictionary } from "@/lib/useDictionaries";
import type { DictionaryGroup } from "@/lib/dictionaries";

const TYPE_GROUP_BY_SPECIES: Record<string, DictionaryGroup> = {
  Древние: "character_type_drevnie",
  Древнерогие: "character_type_drevnerogie",
  Бьёрнгвины: "character_type_bjorngviny",
  Дюнгары: "character_role",
  Компаньоны: "character_type_kompanony"
};

type CharacterSpeciesFieldsProps = {
  defaultSpecies?: string | null;
  defaultType?: string | null;
  defaultSubtype?: string | null;
};

/**
 * Род задаёт набор типов: у Древних, Древнерогих, Бьёрнгвинов, Дюнгаров и
 * Компаньонов они разные. Пока род не выбран, показываем все типы с подписью
 * рода, чтобы старые карты можно было поправить без лишних кликов.
 */
export default function CharacterSpeciesFields({
  defaultSpecies,
  defaultType,
  defaultSubtype
}: CharacterSpeciesFieldsProps) {
  const { entries: species } = useDictionary("character_species");
  const { entries: subtypes } = useDictionary("character_subtype");
  const { entries: drevnie } = useDictionary("character_type_drevnie");
  const { entries: drevnerogie } = useDictionary("character_type_drevnerogie");
  const { entries: bjorngviny } = useDictionary("character_type_bjorngviny");
  const { entries: dyungary } = useDictionary("character_role");
  const { entries: kompanony } = useDictionary("character_type_kompanony");

  const groups: Record<string, typeof drevnie> = {
    character_type_drevnie: drevnie,
    character_type_drevnerogie: drevnerogie,
    character_type_bjorngviny: bjorngviny,
    character_role: dyungary,
    character_type_kompanony: kompanony
  };

  const [speciesCode, setSpeciesCode] = useState(defaultSpecies || "");
  const [type, setType] = useState(defaultType || "");
  const [subtype, setSubtype] = useState(defaultSubtype || "");

  const groupFor = (code: string) => TYPE_GROUP_BY_SPECIES[code];
  const entriesFor = (code: string) =>
    code && groupFor(code) ? groups[groupFor(code)] || [] : [];
  const seen = new Set<string>();
  const allTypes = Object.values(TYPE_GROUP_BY_SPECIES)
    .flatMap((group) => groups[group] || [])
    .filter((entry) => {
      if (seen.has(entry.code)) return false;
      seen.add(entry.code);
      return true;
    });
  const selectedTypes = speciesCode ? entriesFor(speciesCode) : [];
  // У Кьяр и Кьярчат своего набора нет: не запираем форму без типа
  const activeTypes = selectedTypes.length > 0 ? selectedTypes : allTypes;

  const changeSpecies = (value: string) => {
    setSpeciesCode(value);
    const allowed = value ? entriesFor(value) : allTypes;
    if (type && !allowed.some((entry) => entry.code === type)) {
      setType("");
    }
  };

  return (
    <>
      <div className="kjar-field">
        <label className="kjar-label" htmlFor="species">
          Род
        </label>
        <select
          className="kjar-select"
          id="species"
          name="species"
          value={speciesCode}
          onChange={(event) => changeSpecies(event.target.value)}
        >
          <option value="">Не указан</option>
          {species.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="role">
          Тип
        </label>
        <select
          className="kjar-select"
          id="role"
          name="role"
          required
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">Не указан</option>
          {type && !activeTypes.some((entry) => entry.code === type) && (
            <option value={type}>{type} (вне набора рода)</option>
          )}
          {activeTypes.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <p className="kjar-admin__note">
          Набор типов зависит от рода. Свои значения заводятся в справочниках.
        </p>
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="subtype">
          Подтип
        </label>
        <select
          className="kjar-select"
          id="subtype"
          name="subtype"
          value={subtype}
          onChange={(event) => setSubtype(event.target.value)}
        >
          <option value="">Не указан</option>
          {subtype && !subtypes.some((entry) => entry.code === subtype) && (
            <option value={subtype}>{subtype} (вне справочника)</option>
          )}
          {subtypes.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}