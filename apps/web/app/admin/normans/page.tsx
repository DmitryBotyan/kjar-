"use client";

import { useCallback, useEffect, useState } from "react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ImageUpload from "@/components/admin/ImageUpload";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";
import { useDictionary } from "@/lib/useDictionaries";
import type { DictionaryGroup } from "@/lib/dictionaries";
import type { Norman } from "@/lib/types";

interface NormanRow {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  image: string | null;
  kjarCount: number;
}

type Draft = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  image: string | null;
  gender: string;
  occupation: string;
  normanType: string;
  // Пустая строка: шкала не заполнена и в анкету не попадёт
  traits: Record<string, string>;
};

const EMPTY: Draft = {
  slug: "",
  name: "",
  summary: "",
  description: "",
  image: null,
  gender: "",
  occupation: "",
  normanType: "",
  traits: {}
};

function DraftSelect({
  group,
  id,
  label,
  value,
  onChange
}: {
  group: DictionaryGroup;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { entries } = useDictionary(group);
  const missing = value && !entries.some((entry) => entry.code === value);
  return (
    <div className="kjar-field">
      <label className="kjar-label" htmlFor={id}>
        {label}
      </label>
      <select className="kjar-select" id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Не указан</option>
        {missing && <option value={value}>{value} (вне справочника)</option>}
        {entries.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdminNormansPage() {
  const { requireToken, handleError } = useAdminGuard();
  const [normans, setNormans] = useState<NormanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<NormanRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { entries: traitScales } = useDictionary("norman_trait");

  const load = useCallback(async () => {
    if (!requireToken()) return;
    try {
      const response = await adminRequest<{ data: NormanRow[] }>("/normans");
      setNormans(response.data || []);
      setError(null);
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось загрузить норманнов"));
    } finally {
      setLoading(false);
    }
  }, [requireToken, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditing(null);
    setDraft(EMPTY);
  };

  const startEdit = async (row: NormanRow) => {
    try {
      const response = await adminRequest<{ data: Norman }>(`/normans/${row.slug}`);
      const norman = response.data;
      setEditing(norman.slug);
      setDraft({
        slug: norman.slug,
        name: norman.name,
        summary: norman.summary || "",
        description: norman.description || "",
        image: norman.image || null,
        gender: norman.gender || "",
        occupation: norman.occupation || "",
        normanType: norman.normanType || "",
        traits: Object.fromEntries(
          Object.entries(norman.traitsJson || {}).map(([key, value]) => [key, String(value)])
        )
      });
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось открыть норманна"));
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    setSaving(true);
    try {
      const body = JSON.stringify({
        name: draft.name,
        slug: draft.slug.trim() || undefined,
        summary: draft.summary || null,
        description: draft.description || null,
        image: draft.image,
        gender: draft.gender || null,
        occupation: draft.occupation || null,
        normanType: draft.normanType || null,
        traitsJson: Object.fromEntries(
          Object.entries(draft.traits)
            .filter(([, value]) => value !== "")
            .map(([key, value]) => [key, Number(value)])
        )
      });
      await adminRequest(editing ? `/normans/${editing}` : "/normans", {
        method: editing ? "PUT" : "POST",
        body
      });
      setDraft(null);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(handleError(saveError, "Не удалось сохранить норманна"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      await adminRequest(`/normans/${deleteModal.slug}`, { method: "DELETE" });
      setNormans((prev) => prev.filter((item) => item.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (deleteError) {
      setError(handleError(deleteError, "Не удалось удалить норманна"));
    } finally {
      setDeleting(false);
    }
  };

  const set = (patch: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...patch } : current));

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Норманны</h1>
        <div className="kjar-admin__header-actions">
          {!draft && (
            <button type="button" className="kjar-button kjar-button--primary" onClick={startCreate}>
              Добавить норманна
            </button>
          )}
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? <div className="kjar-admin__error">{error}</div> : null}

        {draft && (
          <form className="kjar-form-card" onSubmit={save}>
            <h2 className="kjar-sheet__title">{editing ? "Правка норманна" : "Новый норманн"}</h2>

            <div className="kjar-field">
              <label className="kjar-label" htmlFor="norman-name">
                Имя *
              </label>
              <input
                className="kjar-input"
                id="norman-name"
                required
                maxLength={200}
                value={draft.name}
                onChange={(event) => set({ name: event.target.value })}
              />
            </div>

            <div className="kjar-field">
              <label className="kjar-label" htmlFor="norman-slug">
                Slug
              </label>
              <input
                className="kjar-input"
                id="norman-slug"
                placeholder="Соберётся из имени"
                value={draft.slug}
                onChange={(event) => set({ slug: event.target.value })}
              />
            </div>

            <div className="kjar-field">
              <label className="kjar-label" htmlFor="norman-summary">
                Коротко
              </label>
              <textarea
                className="kjar-textarea"
                id="norman-summary"
                rows={2}
                value={draft.summary}
                onChange={(event) => set({ summary: event.target.value })}
              />
            </div>

            <div className="kjar-field">
              <label className="kjar-label" htmlFor="norman-description">
                О норманне
              </label>
              <textarea
                className="kjar-textarea"
                id="norman-description"
                rows={8}
                value={draft.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </div>

            <ImageUpload
              key={editing || "new"}
              value={draft.image || undefined}
              onChange={(url) => set({ image: url })}
              folder="normans"
              label="Портрет"
              crop={false}
            />
            <p className="kjar-admin__note">
              В списке картинка обрезается в квадрат, на странице норманна видна целиком.
            </p>

            <div className="kjar-sheet__passport">
              <DraftSelect
                group="norman_type"
                id="norman-type"
                label="Тип"
                value={draft.normanType}
                onChange={(normanType) => set({ normanType })}
              />
              <DraftSelect
                group="norman_gender"
                id="norman-gender"
                label="Пол"
                value={draft.gender}
                onChange={(gender) => set({ gender })}
              />
              <DraftSelect
                group="norman_occupation"
                id="norman-occupation"
                label="Род деятельности"
                value={draft.occupation}
                onChange={(occupation) => set({ occupation })}
              />
            </div>

            {traitScales.length > 0 && (
              <div className="kjar-sheet__block">
                <h3 className="kjar-sheet__title">Мини-анкета</h3>
                <p className="kjar-sheet__note">От 0 до 10. Пустая шкала на сайт не выводится.</p>
                <div className="kjar-sheet__passport">
                  {traitScales.map((scale) => (
                    <div className="kjar-field" key={scale.code}>
                      <label className="kjar-label" htmlFor={`trait-${scale.id}`}>
                        {scale.label}
                      </label>
                      <input
                        className="kjar-input"
                        id={`trait-${scale.id}`}
                        type="number"
                        min={0}
                        max={10}
                        step={1}
                        value={draft.traits[scale.code] ?? ""}
                        onChange={(event) =>
                          set({ traits: { ...draft.traits, [scale.code]: event.target.value } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="kjar-form-actions">
              <button type="submit" className="kjar-button kjar-button--primary" disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                className="kjar-button kjar-button--ghost"
                onClick={() => {
                  setDraft(null);
                  setEditing(null);
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="kjar-admin__loading">Загрузка...</div>
        ) : normans.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Норманнов пока нет</p>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
            <table className="kjar-admin__table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Slug</th>
                  <th>Кьяров</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {normans.map((norman) => (
                  <tr key={norman.id}>
                    <td>{norman.name}</td>
                    <td>{norman.slug}</td>
                    <td>{norman.kjarCount}</td>
                    <td>
                      <div className="kjar-admin__actions">
                        <button
                          type="button"
                          className="kjar-admin__action-link"
                          onClick={() => startEdit(norman)}
                        >
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="kjar-admin__action-link kjar-admin__action-link--danger"
                          onClick={() => setDeleteModal(norman)}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
        title="Удалить норманна?"
        message="У его кьяров пропадёт ссылка на норманна. Сами кьяры останутся."
        itemName={deleteModal?.name}
        loading={deleting}
      />
    </div>
  );
}
