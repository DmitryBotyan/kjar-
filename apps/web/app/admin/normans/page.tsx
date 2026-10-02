"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ImageUpload from "@/components/admin/ImageUpload";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";

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
};

const EMPTY: Draft = { slug: "", name: "", summary: "", description: "", image: null };

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

  const load = useCallback(async () => {
    if (!requireToken()) return;
    try {
      const response = await adminRequest<{ data: NormanRow[] }>("/normans");
      setNormans(response.data || []);
      setError(null);
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось загрузить тьорнов"));
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
      const response = await adminRequest<{ data: any }>(`/normans/${row.slug}`);
      const norman = response.data;
      setEditing(norman.slug);
      setDraft({
        slug: norman.slug,
        name: norman.name,
        summary: norman.summary || "",
        description: norman.description || "",
        image: norman.image || null
      });
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось открыть тьорна"));
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
        image: draft.image
      });
      await adminRequest(editing ? `/normans/${editing}` : "/normans", {
        method: editing ? "PUT" : "POST",
        body
      });
      setDraft(null);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(handleError(saveError, "Не удалось сохранить тьорна"));
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
      setError(handleError(deleteError, "Не удалось удалить тьорна"));
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
              Добавить тьорна
            </button>
          )}
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? <div className="kjar-admin__error">{error}</div> : null}

        {draft && (
          <form className="kjar-form-card" onSubmit={save}>
            <h2 className="kjar-sheet__title">{editing ? "Правка тьорна" : "Новый тьорн"}</h2>

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
                О тьорне
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
            />

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
            <p>Тьорнов пока нет</p>
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
        title="Удалить тьорна?"
        message="У его кьяров пропадёт ссылка на тьорна. Сами кьяры останутся."
        itemName={deleteModal?.name}
        loading={deleting}
      />
    </div>
  );
}
