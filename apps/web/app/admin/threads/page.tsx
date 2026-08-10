"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";

interface ThreadRow {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  authorName: string | null;
  isLocked: boolean;
  isPinned: boolean;
  messageCount: number;
  updatedAt: string;
}

export default function AdminThreadsPage() {
  const { requireToken, handleError } = useAdminGuard();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<ThreadRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!requireToken()) return;

    setLoading(true);
    try {
      const response = await adminRequest<{ data: ThreadRow[] }>("/threads?limit=100");
      setThreads(response.data || []);
      setError(null);
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось загрузить обсуждения"));
    } finally {
      setLoading(false);
    }
  }, [requireToken, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const patchThread = async (thread: ThreadRow, changes: Partial<ThreadRow>) => {
    try {
      await adminRequest(`/threads/${thread.slug}`, {
        method: "PATCH",
        body: JSON.stringify(changes)
      });
      setThreads((prev) =>
        prev.map((item) => (item.id === thread.id ? { ...item, ...changes } : item))
      );
    } catch (updateError) {
      setError(handleError(updateError, "Не удалось изменить тему"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      await adminRequest(`/threads/${deleteModal.slug}`, { method: "DELETE" });
      setThreads((prev) => prev.filter((item) => item.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (deleteError) {
      setError(handleError(deleteError, "Не удалось удалить тему"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Обсуждения</h1>
        <div className="kjar-admin__header-actions">
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        {error ? <div className="kjar-admin__error">{error}</div> : null}

        {loading ? (
          <div className="kjar-admin__loading">Загрузка...</div>
        ) : threads.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Тем пока нет</p>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
            <table className="kjar-admin__table">
              <thead>
                <tr>
                  <th>Тема</th>
                  <th>Раздел</th>
                  <th>Автор</th>
                  <th>Сообщений</th>
                  <th>Обновлено</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id}>
                    <td>
                      {thread.title}
                      {thread.isPinned ? " · закреплена" : ""}
                      {thread.isLocked ? " · закрыта" : ""}
                    </td>
                    <td>{thread.category || "—"}</td>
                    <td>{thread.authorName || "—"}</td>
                    <td>{thread.messageCount}</td>
                    <td>{new Date(thread.updatedAt).toLocaleDateString("ru-RU")}</td>
                    <td>
                      <div className="kjar-admin__actions">
                        <Link
                          className="kjar-admin__action-link"
                          href={`/discussions/${thread.slug}`}
                        >
                          Открыть
                        </Link>
                        <button
                          type="button"
                          className="kjar-admin__action-link"
                          onClick={() => patchThread(thread, { isPinned: !thread.isPinned })}
                        >
                          {thread.isPinned ? "Открепить" : "Закрепить"}
                        </button>
                        <button
                          type="button"
                          className="kjar-admin__action-link"
                          onClick={() => patchThread(thread, { isLocked: !thread.isLocked })}
                        >
                          {thread.isLocked ? "Открыть ответы" : "Закрыть тему"}
                        </button>
                        <button
                          type="button"
                          className="kjar-admin__action-link kjar-admin__action-link--danger"
                          onClick={() => setDeleteModal(thread)}
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
        title="Удалить тему?"
        message="Тема удалится вместе со всеми сообщениями. Это действие нельзя отменить."
        itemName={deleteModal?.title}
        loading={deleting}
      />
    </div>
  );
}
