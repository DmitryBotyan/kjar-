"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDictionary } from "@/lib/useDictionaries";
import { speciesMeters } from "@/lib/character";

// Лист кьяра целиком лежит в stats_json: схему БД для этого трогать не нужно.
// Паспортные поля отделены от характеристик, потому что на карте и в профиле
// они играют разные роли: пол и номер идут в плашку, числа в шкалы.

const PASSPORT: Array<{ key: string; label: string; placeholder: string }> = [
  { key: "пол", label: "Пол", placeholder: "" },
  { key: "номер", label: "Номер", placeholder: "12" }
];

const PASSPORT_KEYS = PASSPORT.map((field) => field.key);

type Row = { id: number; label: string; value: string };

type CharacterSheetEditorProps = {
  value: Record<string, unknown> | null | undefined;
  species?: string | null;
  onChange: (next: Record<string, unknown>) => void;
};

let nextRowId = 1;

function splitStats(source: Record<string, unknown> | null | undefined) {
  const passport: Record<string, string> = {};
  const rows: Row[] = [];

  Object.entries(source || {}).forEach(([key, raw]) => {
    const low = key.trim().toLowerCase();
    if (PASSPORT_KEYS.includes(low)) {
      passport[low] = raw === null || raw === undefined ? "" : String(raw);
      return;
    }
    rows.push({ id: nextRowId++, label: key, value: String(raw ?? "") });
  });

  return { passport, rows };
}

export default function CharacterSheetEditor({
  value,
  species,
  onChange
}: CharacterSheetEditorProps) {
  const initial = useMemo(() => splitStats(value), []);
  // Базовый набор шкал задаётся справочником character_meter, а не списком
  // в коде: он же определяет порядок шкал на карточке кьяра.
  const { entries: baseMeters } = useDictionary("character_meter");
  // Пол выбирается из справочника: по этим же значениям фильтрует колода
  const { entries: genders } = useDictionary("character_gender");
  const [passport, setPassport] = useState<Record<string, string>>(initial.passport);
  const [rows, setRows] = useState<Row[]>(initial.rows);

  const rules = speciesMeters(species);
  const maxFor = (label: string) =>
    rules.find((rule) => rule.label.toLowerCase() === label.trim().toLowerCase())?.max;

  // Наружу уходит один объект: пустые поля в него не попадают
  const emit = (nextPassport: Record<string, string>, nextRows: Row[]) => {
    const result: Record<string, unknown> = {};

    PASSPORT_KEYS.forEach((key) => {
      const raw = (nextPassport[key] || "").trim();
      if (raw) result[key] = raw;
    });

    nextRows.forEach((row) => {
      const label = row.label.trim();
      if (!label) return;
      const raw = row.value.trim();
      if (!raw) return;
      const asNumber = Number(raw);
      result[label] = raw !== "" && !Number.isNaN(asNumber) ? asNumber : raw;
    });

    onChange(result);
  };

  // При выборе Древних у новой карты сразу появляются три родовые шкалы
  const lastSpecies = useRef(species || "");
  useEffect(() => {
    if (!species || species === lastSpecies.current) return;
    lastSpecies.current = species;
    if (rows.length > 0) return;

    const added = speciesMeters(species).map((rule) => ({
      id: nextRowId++,
      label: rule.label,
      value: "0"
    }));
    if (added.length === 0) return;
    setRows(added);
    emit(passport, added);
  }, [species]);

  const updatePassport = (key: string, raw: string) => {
    const next = { ...passport, [key]: raw };
    setPassport(next);
    emit(next, rows);
  };

  const updateRow = (id: number, patch: Partial<Row>) => {
    const next = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    setRows(next);
    emit(passport, next);
  };

  const addRow = (label = "") => {
    const next = [...rows, { id: nextRowId++, label, value: "" }];
    setRows(next);
    emit(passport, next);
  };

  const removeRow = (id: number) => {
    const next = rows.filter((row) => row.id !== id);
    setRows(next);
    emit(passport, next);
  };

  const addBaseMeters = () => {
    const known = rows.map((row) => row.label.trim().toLowerCase());
    const source =
      rules.length > 0
        ? rules.map((rule) => ({ label: rule.label, value: "0" }))
        : baseMeters.map((meter) => ({ label: meter.label, value: "5" }));
    const added = source
      .filter((meter) => !known.includes(meter.label.toLowerCase()))
      .map((meter) => ({ id: nextRowId++, label: meter.label, value: meter.value }));
    const next = [...rows, ...added];
    setRows(next);
    emit(passport, next);
  };

  return (
    <div className="kjar-sheet">
      <div className="kjar-sheet__block">
        <h2 className="kjar-sheet__title">Паспорт карты</h2>
        <p className="kjar-sheet__note">
          Номер выводится на плашке карты, пол работает в фильтре колоды.
        </p>
        <div className="kjar-sheet__passport">
          {PASSPORT.map((field) => (
            <div className="kjar-field" key={field.key}>
              <label className="kjar-label" htmlFor={`sheet-${field.key}`}>
                {field.label}
              </label>
              {field.key === "пол" ? (
                <select
                  className="kjar-select"
                  id={`sheet-${field.key}`}
                  value={passport[field.key] || ""}
                  onChange={(event) => updatePassport(field.key, event.target.value)}
                >
                  <option value="">Не указан</option>
                  {/* Старое значение вне справочника не теряется при правке */}
                  {passport[field.key] &&
                    !genders.some((entry) => entry.code === passport[field.key]) && (
                      <option value={passport[field.key]}>{passport[field.key]}</option>
                    )}
                  {genders.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="kjar-input"
                  id={`sheet-${field.key}`}
                  type="text"
                  value={passport[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) => updatePassport(field.key, event.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="kjar-sheet__block">
        <h2 className="kjar-sheet__title">Характеристики</h2>
        <p className="kjar-sheet__note">
          {rules.length > 0
            ? "У Древних родовые шкалы: Первородная Власть и Господство до 500, Накопленная Власть до 300."
            : "Числа от 1 до 10 рисуются шкалами под именем кьяра. Текстовое значение показывается отдельной парой «подпись и значение»."}
        </p>

        {rows.length > 0 && (
          <ul className="kjar-sheet__rows">
            {rows.map((row) => (
              <li className="kjar-sheet__row" key={row.id}>
                <input
                  className="kjar-input"
                  type="text"
                  value={row.label}
                  placeholder="Название"
                  aria-label="Название характеристики"
                  onChange={(event) => updateRow(row.id, { label: event.target.value })}
                />
                <input
                  className="kjar-input"
                  type="text"
                  value={row.value}
                  placeholder={
                    maxFor(row.label) ? `0–${maxFor(row.label)}` : "1–10"
                  }
                  aria-label={`Значение: ${row.label || "характеристика"}`}
                  onChange={(event) => updateRow(row.id, { value: event.target.value })}
                />
                <button
                  className="kjar-button kjar-button--danger"
                  type="button"
                  onClick={() => removeRow(row.id)}
                >
                  Убрать
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="kjar-form-actions">
          <button className="kjar-button" type="button" onClick={() => addRow()}>
            Добавить характеристику
          </button>
          <button className="kjar-button kjar-button--ghost" type="button" onClick={addBaseMeters}>
            {rules.length > 0 ? "Взять шкалы рода" : "Взять базовый набор"}
          </button>
        </div>
      </div>
    </div>
  );
}
