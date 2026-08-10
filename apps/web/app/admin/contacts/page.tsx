"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";

interface ContactRequest {
  id: number;
  name: string;
  contact: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const STATUSES = [
  { value: "new", label: "Новое" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Закрыто" }
];

export default function AdminContactsPage() {
  const { requireToken, handleError } = useAdminGuard();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  // Со сводки на главной приходят по ссылке ?status=new — учитываем это
  const [filter, setFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("status") || "";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<ContactRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!requireToken()) return;

    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const response = await adminRequest<{ data: ContactRequest[] }>(`/contacts${query}`);
      setRequests(response.data || []);
      setError(null);
    } catch (loadError) {
      setError(handleError(loadError, "Не удалось загрузить обращения"));
    } finally {
      setLoading(false);
    }
  }, [filter, requireToken, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (request: ContactRequest, status: string) => {
    try {
      await adminRequest(`/contacts/${request.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setRequests((prev) => prev.map((item) => (item.id === request.id ? { ...item, status } : item)));
    } catch (updateError) {
      setError(handleError(updateError, "Не удалось изменить статус"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      await adminRequest(`/contacts/${deleteModal.id}`, { method: "DELETE" });
      setRequests((prev) => prev.filter((item) => item.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (deleteError) {
      setError(handleError(deleteError, "Не удалось удалить обращение"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Обращения</h1>
        <div className="kjar-admin__header-actions">
          <Link href="/admin" className="kjar-button kjar-button--ghost">
            Назад
          </Link>
        </div>
      </div>

      <div className="kjar-admin__content">
        <div className="kjar-admin__toolbar">
          <div className="kjar-field">
            <label className="kjar-label" htmlFor="contact-status-filter">
              Статус
            </label>
            <select
              className="kjar-select"
              id="contact-status-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="">Все</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="kjar-admin__error">{error}</div> : null}

        {loading ? (
          <div className="kjar-admin__loading">Загрузка...</div>
        ) : requests.length === 0 ? (
          <div className="kjar-admin__empty">
            <p>Обращений нет</p>
          </div>
        ) : (
          <div className="kjar-admin__table-wrap">
            <table className="kjar-admin__table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Имя</th>
                  <th>Связь</th>
                  <th>Тема и сообщение</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{new Date(request.createdAt).toLocaleString("ru-RU")}</td>
                    <td>{request.name}</td>
                    <td>{request.contact}</td>
                    <td>
                      <strong>{request.subject}</strong>
                      <br />
                      {request.message}
                    </td>
                    <td>
                      <select
                        className="kjar-select"
                        value={request.status}
                        aria-label={`Статус обращения от ${request.name}`}
                        onChange={(event) => changeStatus(request, event.target.value)}
                      >
                        {STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="kjar-admin__actions">
                        <button
                          type="button"
                          className="kjar-admin__action-link kjar-admin__action-link--danger"
                          onClick={() => setDeleteModal(request)}
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
        title="Удалить обращение?"
        message="Обращение будет удалено без возможности восстановления."
        itemName={deleteModal?.subject}
        loading={deleting}
      />
    </div>
  );
}
