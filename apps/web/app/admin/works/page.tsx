"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";

interface WorkRow {
  id: number;
  authorName: string;
  title: string | null;
  image: string;
  isApproved: boolean;
  createdAt: string;
  characterName: string;
  characterSlug: string;
}

export default function AdminWorksPage() {
  const { requireToken, handleError } = useAdminGuard();
  const [works, setWorks] = useState<WorkRow[]>([]);
  const [filter, setFilter] = useState("false");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<WorkRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!requireToken()) return;

    setLoading(true);
    try {
      const query = filter ? `?approved=${filter}` : "";
      const response = await adminRequest<{ data: WorkRow[] }>(`/works${query}`);
      setWorks(response.data || []);
      setError(null);
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось загрузить работы"));
    } finally {
      setLoading(false);
    }
  }, [filter, requireToken, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleApproval = async (work: WorkRow) => {
    try {
      await adminRequest(`/works/${work.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved: !work.isApproved })
      });
      setWorks((prev) =>
        filter
          ? prev.filter((item) => item.id !== work.id)
          : prev.map((item) =>
              item.id === work.id ? { ...item, isApproved: !item.isApproved } : item
            )
      );
    } catch (updateError) {
      setError(handleError(updateError, "Не удалось изменить работу"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      await adminRequest(`/works/${deleteModal.id}`, { method: "DELETE" });
      setWorks((prev) => prev.filter((item) => item.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (deleteError) {
      setError(handleError(deleteError, "Не удалось удалить работу"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Работы игроков</h1>
      </div>

      <div className="kjar-admin__content">
        <div className="kjar-admin__toolbar">
          <div className="kjar-field">
            <label className="kjar-label" htmlFor="work-filter">
              Показать
            </label>
            <select
              className="kjar-select"
              id="work-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="false">Ждут одобрения</option>
              <option value="true">Опубликованные</option>
              <option value="">Все</option>
            </select>
          </div>
        </div>

        {error ? <div className="kjar-admin__error">{error}</div> : null}

        {loading ? (
          <div className="kjar-admin__loading">Загрузка...</div>
        ) : works.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>{filter === "false" ? "Новых работ нет" : "Работ нет"}</p>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
            <table className="kjar-admin__table">
              <thead>
                <tr>
                  <th>Работа</th>
                  <th>Кьяр</th>
                  <th>Автор</th>
                  <th>Прислана</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {works.map((work) => (
                  <tr key={work.id}>
                    <td>
                      <a href={work.image} target="_blank" rel="noreferrer">
                        <img className="kjar-admin__thumb" src={work.image} alt={work.title || ""} />
                      </a>
                      {work.title && <div>{work.title}</div>}
                    </td>
                    <td>
                      <Link href={`/characters/${work.characterSlug}`} target="_blank">
                        {work.characterName}
                      </Link>
                    </td>
                    <td>{work.authorName}</td>
                    <td>{new Date(work.createdAt).toLocaleString("ru-RU")}</td>
                    <td>{work.isApproved ? "На сайте" : "Ждёт"}</td>
                    <td>
                      <div className="kjar-admin__actions">
                        <button
                          type="button"
                          className="kjar-admin__action-link"
                          onClick={() => toggleApproval(work)}
                        >
                          {work.isApproved ? "Снять" : "Одобрить"}
                        </button>
                        <button
                          type="button"
                          className="kjar-admin__action-link kjar-admin__action-link--danger"
                          onClick={() => setDeleteModal(work)}
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
        title="Удалить работу?"
        message="Работа пропадёт со страницы кьяра без возможности восстановления."
        itemName={deleteModal?.title || deleteModal?.authorName}
        loading={deleting}
      />
    </div>
  );
}
