"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useDictionary } from "@/lib/useDictionaries";

type Kin = { kind: string; name: string; slug: string | null };
type Achievement = { title: string; note: string | null };
type Option = { slug: string; name: string };
type NormanOption = { id: number; name: string };

export type CharacterCardValue = {
  tjornId: number | null;
  favorite: string | null;
  features: string | null;
  achievementsJson: Achievement[];
  relationsJson: Kin[];
};

type CharacterCardEditorProps = {
  initial?: Partial<{
    slug: string;
    tjornId: number | null;
    favorite: string | null;
    features: string | null;
    achievementsJson: unknown;
    relationsJson: unknown;
  }>;
  onChange: (value: CharacterCardValue) => void;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function initialKin(raw: unknown): Kin[] {
  return asArray<any>(raw).map((row) => ({
    kind: String(row?.kind ?? row?.type ?? ""),
    name: String(row?.name ?? ""),
    slug: row?.slug ? String(row.slug) : null
  }));
}

export default function CharacterCardEditor({ initial, onChange }: CharacterCardEditorProps) {
  const { entries: kinds } = useDictionary("character_kinship");
  const [normans, setNormans] = useState<NormanOption[]>([]);
  const [kjars, setKjars] = useState<Option[]>([]);

  const [tjornId, setTjornId] = useState<number | null>(initial?.tjornId ?? null);
  const [favorite, setFavorite] = useState(initial?.favorite || "");
  const [features, setFeatures] = useState(initial?.features || "");
  const [achievements, setAchievements] = useState<Achievement[]>(
    asArray<Achievement>(initial?.achievementsJson)
  );
  const [kin, setKin] = useState<Kin[]>(initialKin(initial?.relationsJson));

  useEffect(() => {
    fetch("/api/normans", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setNormans(body.data || []))
      .catch(() => setNormans([]));
    fetch("/api/characters?limit=500", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) =>
        setKjars(
          (body.data || [])
            .filter((row: Option) => row.slug !== initial?.slug)
            .map((row: Option) => ({ slug: row.slug, name: row.name }))
            .sort((a: Option, b: Option) => a.name.localeCompare(b.name, "ru"))
        )
      )
      .catch(() => setKjars([]));
  }, [initial?.slug]);

  useEffect(() => {
    onChange({
      tjornId,
      favorite: favorite.trim() || null,
      features: features.trim() || null,
      achievementsJson: achievements.filter((row) => row.title.trim()),
      relationsJson: kin.filter((row) => row.kind && (row.name.trim() || row.slug))
    });
  }, [tjornId, favorite, features, achievements, kin, onChange]);

  const updateKin = (index: number, patch: Partial<Kin>) =>
    setKin((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const linkKjar = (index: number, slug: string) => {
    const card = kjars.find((row) => row.slug === slug);
    updateKin(index, { slug: card ? card.slug : null, ...(card && { name: card.name }) });
  };

  const updateAchievement = (index: number, patch: Partial<Achievement>) =>
    setAchievements((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <>
      <div className="kjar-field">
        <label className="kjar-label" htmlFor="tjorn">
          Тьорн кьяра
        </label>
        <select
          className="kjar-select"
          id="tjorn"
          value={tjornId ?? ""}
          onChange={(event) => setTjornId(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">Без тьорна</option>
          {normans.map((norman) => (
            <option key={norman.id} value={norman.id}>
              {norman.name}
            </option>
          ))}
        </select>
        <p className="kjar-sheet__note">
          Имя станет ссылкой на страницу тьорна. Новых тьорнов заводят в разделе{" "}
          <Link href="/admin/normans">Норманны</Link>.
        </p>
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="favorite">
          Любимая еда / предмет
        </label>
        <input
          className="kjar-input"
          id="favorite"
          value={favorite}
          maxLength={300}
          onChange={(event) => setFavorite(event.target.value)}
        />
      </div>

      <div className="kjar-field">
        <label className="kjar-label" htmlFor="features">
          Особенности и примечания
        </label>
        <textarea
          className="kjar-textarea"
          id="features"
          rows={5}
          value={features}
          onChange={(event) => setFeatures(event.target.value)}
        />
      </div>

      <div className="kjar-sheet">
        <div className="kjar-sheet__block">
        <h2 className="kjar-sheet__title">Ачивки</h2>
        <ul className="kjar-sheet__rows">
        {achievements.map((row, index) => (
          <li className="kjar-sheet__row kjar-sheet__row--pair" key={index}>
            <input
              className="kjar-input"
              placeholder="Название"
              aria-label="Название ачивки"
              value={row.title}
              maxLength={200}
              onChange={(event) => updateAchievement(index, { title: event.target.value })}
            />
            <input
              className="kjar-input"
              placeholder="За что, необязательно"
              aria-label="Пояснение к ачивке"
              value={row.note || ""}
              maxLength={1000}
              onChange={(event) => updateAchievement(index, { note: event.target.value })}
            />
            <button
              type="button"
              className="kjar-button kjar-button--danger"
              onClick={() => setAchievements((rows) => rows.filter((_, i) => i !== index))}
              aria-label="Удалить ачивку"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </li>
        ))}
        </ul>
        <div className="kjar-form-actions">
          <button
            type="button"
            className="kjar-button"
            onClick={() => setAchievements((rows) => [...rows, { title: "", note: null }])}
          >
            <Plus aria-hidden="true" /> Добавить ачивку
          </button>
        </div>
        </div>

        <div className="kjar-sheet__block">
        <h2 className="kjar-sheet__title">Родственные связи и потомство</h2>
        <p className="kjar-sheet__note">
          Если родич есть на сайте, выберите его карточку: имя станет ссылкой. Если нет —
          просто впишите имя. Вид «Потомок» попадает в графу «Потомство».
        </p>
        <ul className="kjar-sheet__rows">
        {kin.map((row, index) => (
          <li className="kjar-sheet__row kjar-sheet__row--kin" key={index}>
            <select
              className="kjar-select"
              aria-label="Родство"
              value={row.kind}
              onChange={(event) => updateKin(index, { kind: event.target.value })}
            >
              <option value="">Родство</option>
              {kinds.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.label}
                </option>
              ))}
              {row.kind && !kinds.some((entry) => entry.code === row.kind) && (
                <option value={row.kind}>{row.kind}</option>
              )}
            </select>
            <select
              className="kjar-select"
              aria-label="Карточка кьяра"
              value={row.slug || ""}
              onChange={(event) => linkKjar(index, event.target.value)}
            >
              <option value="">Нет карточки на сайте</option>
              {kjars.map((card) => (
                <option key={card.slug} value={card.slug}>
                  {card.name}
                </option>
              ))}
            </select>
            <input
              className="kjar-input"
              placeholder="Имя"
              aria-label="Имя родича"
              value={row.name}
              maxLength={200}
              onChange={(event) => updateKin(index, { name: event.target.value })}
            />
            <button
              type="button"
              className="kjar-button kjar-button--danger"
              onClick={() => setKin((rows) => rows.filter((_, i) => i !== index))}
              aria-label="Удалить связь"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </li>
        ))}
        </ul>
        <div className="kjar-form-actions">
          <button
            type="button"
            className="kjar-button"
            onClick={() => setKin((rows) => [...rows, { kind: "", name: "", slug: null }])}
          >
            <Plus aria-hidden="true" /> Добавить родича
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
