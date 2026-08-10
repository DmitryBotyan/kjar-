"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";

interface CommentRow {
  id: number;
  targetType: string;
  targetId: number;
  authorName: string;
  content: string;
  image: string | null;
  parentId: number | null;
  isApproved: boolean;
  createdAt: string;
}

const TARGET_LABELS: Record<string, string> = {
  post: "Пост",
  event: "Ивент",
  article: "Статья"
};

export default function AdminCommentsPage() {
  const { requireToken, handleError } = useAdminGuard();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<CommentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!requireToken()) return;

    setLoading(true);
    try {
      const query = filter ? `?approved=${filter}` : "";
      const response = await adminRequest<{ data: CommentRow[] }>(`/comments${query}`);
      setComments(response.data || []);
      setError(null);
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось загрузить комментарии"));
    } finally {
      setLoading(false);
    }
  }, [filter, requireToken, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleApproval = async (comment: CommentRow) => {
    try {
      await adminRequest(`/comments/${comment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved: !comment.isApproved })
      });
      setComments((prev) =>
        prev.map((item) =>
          item.id === comment.id ? { ...item, isApproved: !item.isApproved } : item
        )
      );
    } catch (updateError) {
      setError(handleError(updateError, "Не удалось изменить видимость"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      await adminRequest(`/comments/${deleteModal.id}`, { method: "DELETE" });
      setComments((prev) => prev.filter((item) => item.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (deleteError) {
      setError(handleError(deleteError, "Не удалось удалить комментарий"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Комментарии</h1>
        <div className="kjar-admin__header-actions">
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        <div className="kjar-admin__toolbar">
          <div className="kjar-field">
            <label className="kjar-label" htmlFor="comment-filter">
              Видимость
            </label>
            <select
              className="kjar-select"
              id="comment-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="">Все</option>
              <option value="true">Показаны</option>
              <option value="false">Скрытые</option>
            </select>
          </div>
        </div>

        {error ? <div className="kjar-admin__error">{error}</div> : null}

        {loading ? (
          <div className="kjar-admin__loading">Загрузка...</div>
        ) : comments.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Комментариев нет</p>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
            <table className="kjar-admin__table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Автор</th>
                  <th>Где</th>
                  <th>Текст</th>
                  <th>Видимость</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td>{new Date(comment.createdAt).toLocaleString("ru-RU")}</td>
                    <td>{comment.authorName}</td>
                    <td>
                      {TARGET_LABELS[comment.targetType] || comment.targetType} №{comment.targetId}
                      {comment.parentId ? " · ответ" : ""}
                    </td>
                    <td>{comment.content}</td>
                    <td>{comment.isApproved ? "Показан" : "Скрыт"}</td>
                    <td>
                      <div className="kjar-admin__actions">
                        <button
                          type="button"
                          className="kjar-admin__action-link"
                          onClick={() => toggleApproval(comment)}
                        >
                          {comment.isApproved ? "Скрыть" : "Вернуть"}
                        </button>
                        <button
                          type="button"
                          className="kjar-admin__action-link kjar-admin__action-link--danger"
                          onClick={() => setDeleteModal(comment)}
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
        title="Удалить комментарий?"
        message="Комментарий и ответы на него будут удалены без возможности восстановления."
        itemName={deleteModal?.authorName}
        loading={deleting}
      />
    </div>
  );
}
